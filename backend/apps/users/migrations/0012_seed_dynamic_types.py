"""Data migration: seed TypeService and TypeBeneficiaire with the formerly-hardcoded values."""
from django.db import migrations


TYPE_SERVICE_SEEDS = [
    "administratif",
    "chu",
    "decanat",
    "pharmacie",
    "dentaire",
    "labo",
    "association",
]

TYPE_BENEFICIAIRE_SEEDS = [
    "chef_service",
    "fonctionnaire",
    "secretariat",
    "salle_de_cours",
    "prof",
    "personnel",
]


def seed_types(apps, schema_editor):
    TypeService = apps.get_model("users", "TypeService")
    TypeBeneficiaire = apps.get_model("users", "TypeBeneficiaire")

    for nom in TYPE_SERVICE_SEEDS:
        TypeService.objects.get_or_create(nom=nom)

    for nom in TYPE_BENEFICIAIRE_SEEDS:
        TypeBeneficiaire.objects.get_or_create(nom=nom)


def unseed_types(apps, schema_editor):
    # No-op reverse: we don't delete seeded data on rollback
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0011_dynamic_types"),
    ]

    operations = [
        migrations.RunPython(seed_types, unseed_types),
    ]
