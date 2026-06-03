import glob, re

files = glob.glob('c:/Users/n/fdm/frontend/src/**/*.jsx', recursive=True)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    original_content = content
    
    # Replace color variables
    content = re.sub(r"blue:\s*'#[0-9a-fA-F]+'", "primary: '#6366f1'", content)
    content = re.sub(r"lightBlue:\s*'#[0-9a-fA-F]+'", "lightPrimary: '#8b5cf6'", content)
    content = re.sub(r"green:\s*'#[0-9a-fA-F]+'", "primary: '#6366f1'", content)
    content = re.sub(r"lightGreen:\s*'#[0-9a-fA-F]+'", "lightPrimary: '#8b5cf6'", content)
    content = re.sub(r"accent:\s*'#[0-9a-fA-F]+'", "primary: '#6366f1'", content)

    # Replace specific hex colors in components that don't use tokens
    content = content.replace("'#0C447C'", "'#6366f1'")
    content = content.replace("'#1a7abf'", "'#8b5cf6'")
    content = content.replace("'#0F6E56'", "'#6366f1'")
    content = content.replace("'#1D9E75'", "'#8b5cf6'")
    
    # Replace variable names
    content = content.replace('T.blue', 'T.primary')
    content = content.replace('T.lightBlue', 'T.lightPrimary')
    content = content.replace('T.green', 'T.primary')
    content = content.replace('T.lightGreen', 'T.lightPrimary')
    content = content.replace('T.accent', 'T.primary')
    
    content = content.replace('C.blue', 'C.primary')
    content = content.replace('C.lightBlue', 'C.lightPrimary')
    content = content.replace('C.green', 'C.primary')
    content = content.replace('C.lightGreen', 'C.lightPrimary')
    content = content.replace('C.accent', 'C.primary')
    
    # Replace primary button background
    content = re.sub(
        r"background:\s*[TC]\.primary,\s*color:\s*'#fff'",
        "background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)', color: '#ffffff'",
        content
    )
    
    # Also multiline versions
    content = re.sub(
        r"background:\s*[TC]\.primary,\n\s*color:\s*'#fff'",
        "background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',\n  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',\n  color: '#ffffff'",
        content
    )
    
    # Sometimes just background: C.primary
    # wait, if btnPrimary has background: C.primary; we just did the color: '#fff' check to make sure it's a primary button

    if content != original_content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f'Updated {f}')
