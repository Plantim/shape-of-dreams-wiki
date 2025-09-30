import re
import os

# ==============================================================================
# === CONFIGURATION (Adaptée à votre projet) ===
# ==============================================================================
# La liste de tous les fichiers à mettre à jour.
FILES_TO_UPDATE = [
    'loader.js',
    'index.html',
    'memories.html',
    'essences.html'  # Corrigé selon votre demande
]

# Le chemin vers votre fichier loader, qui est à la racine.
LOADER_FILE_PATH = 'loader.js' # Corrigé selon votre demande

# ==============================================================================
# === SCRIPT AMÉLIORÉ (Aucune autre modification nécessaire) ===
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
    print("--- Script de mise à jour de version du site (version intelligente) ---")

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
                # Pour les fichiers JS, on fait un simple remplacement
                new_content = original_content.replace(old_version, new_version)
            elif file_path.endswith('.html'):
                # Pour les fichiers HTML, la regex gère l'ajout ou la mise à jour de la version
                # Cible : src="loader.js" (sans dossier)
                pattern = re.compile(r'(src\s*=\s*["\'])loader\.js(?:\?v=[^"\']+)?(["\'])', re.IGNORECASE)
                
                # Remplace par : src="loader.js?v=NOUVELLE_VERSION"
                replacement = rf'\g<1>loader.js?v={new_version}\g<2>'
                
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