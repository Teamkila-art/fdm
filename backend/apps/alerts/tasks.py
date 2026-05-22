from datetime import date

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.alerts.email_utils import send_alert_email
from apps.alerts.models import AlerteDelai, Notification, NotificationType
from apps.alerts.notification_service import create_notification
from apps.core.celery import app
from apps.procurement.models import MarcheBC
from apps.users.models import Utilisateur

@app.task(queue="alerts")
def check_marche_deadlines():
    """
    Periodic task that checks procurement delivery deadlines and creates
    alerts based on the acquisition type:
      - marché        → warning at 10 days, critique at 5 days
      - bon_commande  → warning at 3 days,  critique at 1 day
      - donation      → no deadline alerts (immediate delivery)
    """
    today = date.today()
    gestionnaires = Utilisateur.objects.filter(id_role__nom_role="gestionnaire_magasin", actif=True)
    financiers = Utilisateur.objects.filter(id_role__nom_role="service_financiere", actif=True)
    destinataires_gest = list(gestionnaires.values_list("email", flat=True))
    destinataires_fin = list(financiers.values_list("email", flat=True))
    destinataires_all = list(set(destinataires_gest + destinataires_fin))

    # Alert thresholds per type: (warning_days, critique_days)
    ALERT_THRESHOLDS = {
        "marche":       (10, 5),
        "bon_commande": (3,  1),
    }

    marches = MarcheBC.objects.filter(
        statut="en_attente_livraison",
        date_livraison_prevue__isnull=False,
    ).exclude(type_acquisition="donation")

    for marche in marches:
        jours_restants = (marche.date_livraison_prevue - today).days
        warning_days, critique_days = ALERT_THRESHOLDS.get(
            marche.type_acquisition, (10, 5)
        )
        type_label = "marché" if marche.type_acquisition == "marche" else "bon de commande"
        alerte_kwargs = {"id_marche": marche}

        if jours_restants < 0:
            # ── Overdue ──
            alerte, created = AlerteDelai.objects.get_or_create(
                niveau_alerte="critique",
                penalite_applicable=True,
                acquitte=False,
                defaults={"date_echeance": marche.date_livraison_prevue, **alerte_kwargs},
                **alerte_kwargs
            )
            subject = f"[FMPDF] URGENCE: Délai dépassé — {marche.reference}"
            context = {"marche": marche, "jours_restants": jours_restants}
            send_alert_email(destinataires_all, subject, context)

        elif jours_restants <= critique_days:
            # ── Critical zone ──
            alerte, created = AlerteDelai.objects.get_or_create(
                niveau_alerte="critique",
                penalite_applicable=False,
                acquitte=False,
                defaults={"date_echeance": marche.date_livraison_prevue, **alerte_kwargs},
                **alerte_kwargs
            )
            subject = (
                f"[FMPDF] Alerte délai — {marche.reference} "
                f"({jours_restants}j restants, {type_label})"
            )
            context = {"marche": marche, "jours_restants": jours_restants}
            send_alert_email(destinataires_all, subject, context)

        elif jours_restants <= warning_days:
            # ── Warning zone ──
            alerte, created = AlerteDelai.objects.get_or_create(
                niveau_alerte="warning",
                penalite_applicable=False,
                acquitte=False,
                defaults={"date_echeance": marche.date_livraison_prevue, **alerte_kwargs},
                **alerte_kwargs
            )
            for user in gestionnaires:
                create_notification(
                    user,
                    NotificationType.ALERTE_DELAI,
                    f"Le {type_label} {marche.reference} arrive à échéance "
                    f"dans {jours_restants} jour(s).",
                    content_object=marche,
                    lien=f"/gestionnaire/marches/{marche.pk}",
                )


@app.task(queue="alerts")
def send_notification_email(notification_id: int):
    try:
        notif = Notification.objects.get(pk=notification_id)
    except Notification.DoesNotExist:
        return
    subject = "Notification FMPDF"
    message = notif.message
    recipient = notif.destinataire.email
    html_message = render_to_string("emails/alerte_delai.html", {"notification": notif})
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient],
        html_message=html_message,
    )
    notif.lu = True
    notif.save(update_fields=["lu"])
