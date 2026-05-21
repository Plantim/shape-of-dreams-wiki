# v1.0.1
import re
import os

# Le chemin de base du projet (le dossier parent du dossier 'scripts')
# __file__ est le chemin du script actuel. os.path.dirname() prend son dossier. os.path.abspath() le rend absolu.
# os.path.join(..., '..') remonte d'un niveau.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# ==============================================================================
# === CONFIGURATION (Les chemins sont maintenant relatifs à la racine du projet) ===
# ==============================================================================
# Le chemin vers votre fichier loader.
LOADER_FILE_PATH = os.path.join(PROJECT_ROOT, 'assets', 'js', 'loader.js')

# La liste de tous les fichiers à mettre à jour.
FILES_TO_UPDATE = [
    LOADER_FILE_PATH,
    os.path.join(PROJECT_ROOT, 'index.html'),
    os.path.join(PROJECT_ROOT, 'memories.html'),
    os.path.join(PROJECT_ROOT, 'essences.html')
]
# ==============================================================================
# === SCRIPT (Aucune autre modification nécessaire) ===
# ==============================================================================

def find_current_version(loader_path):
    """Lit le fichier loader.js et extrait le numéro de version actuel."""
    try:
        with open(loader_path, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'const siteVersion = "(.+?)"', content)
            if match:
                return match.group(1)
    except FileNotFoundError:
        print(f"ERREUR : Le fichier loader '{loader_path}' n'a pas été trouvé.")
    except Exception as e:
        print(f"Une erreur est survenue en lisant la version : {e}")
    return None

def main():
    """Fonction principale du script."""
    print("--- Script de mise à jour de version du site (Structure Conventionnelle) ---")

    old_version = find_current_version(LOADER_FILE_PATH)
    if not old_version:
        return
        
    print(f"\nVersion actuelle détectée : {old_version}")

    new_version = input("Entrez le nouveau numéro de version : ").strip()

    if not new_version:
        print("Aucune version entrée. Annulation.")
        return

    if new_version == old_version:
        print("La nouvelle version est identique à l'ancienne. Aucune modification nécessaire.")
        return

    print(f"\nMise à jour de la version -> {new_version}\n")

    for file_path in FILES_TO_UPDATE:
        if not os.path.exists(file_path):
            print(f"⚠️ Fichier non trouvé : '{file_path}'. Ignoré.")
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()

            new_content = original_content

            if file_path.endswith('.js'):
                # Pour les fichiers JS, simple remplacement du numéro de version
                new_content = original_content.replace(f'const siteVersion = "{old_version}"', f'const siteVersion = "{new_version}"')
            elif file_path.endswith('.html'):
                # Pour les fichiers HTML, on met à jour la version dans le chemin du loader.js
                pattern = re.compile(r'(src\s*=\s*["\']assets/js/loader\.js)(?:\?v=[^"\']+)?(["\'])', re.IGNORECASE)
                replacement = rf'\g<1>?v={new_version}\g<2>'
                new_content = pattern.sub(replacement, original_content)

            if new_content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"✅ Fichier mis à jour : {file_path}")
            else:
                print(f"ℹ️ Aucune modification nécessaire pour : {file_path}")

        except Exception as e:
            print(f"❌ ERREUR lors de la mise à jour du fichier {file_path}: {e}")

    print(f"\n--- Mise à jour terminée. ---")

if __name__ == "__main__":
    main()