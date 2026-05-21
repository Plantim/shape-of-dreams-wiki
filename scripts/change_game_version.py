# v1.0.1
import re
import os

# Le chemin de base du projet (le dossier parent du dossier 'scripts')
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Configuration du chemin vers common.js
COMMON_FILE_PATH = os.path.join(PROJECT_ROOT, 'assets', 'js', 'common.js')

def find_current_game_version(common_path):
    """Lit le fichier common.js et extrait la gameVersion actuelle."""
    try:
        with open(common_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Regex pour trouver const gameVersion = "X.X.X"; ou 'X.X.X';
        match = re.search(r'const\s+gameVersion\s*=\s*["\']([^"\']+)["\']', content)
        if match:
            return match.group(1)
        return None
    except Exception as e:
        print(f"❌ Erreur lors de la lecture de common.js : {e}")
        return None

def main():
    print("=== SCRIPT DE MISE À JOUR DE LA VERSION DU JEU (gameVersion) ===")
    
    if not os.path.exists(COMMON_FILE_PATH):
        print(f"❌ Fichier introuvable : '{COMMON_FILE_PATH}'")
        print("Vérifie que le script est bien placé dans un sous-dossier (ex: 'scripts') à la racine de ton projet.")
        input("\nAppuie sur Entrée pour quitter...")
        return

    # 1. Recherche de la version actuelle
    old_version = find_current_game_version(COMMON_FILE_PATH)
    if not old_version:
        print("❌ Impossible de trouver la variable 'gameVersion' dans common.js.")
        input("\nAppuie sur Entrée pour quitter...")
        return

    print(f"ℹ️  Data à jour avec la version : {old_version}")

    # 2. Demande de la nouvelle version
    new_version = input("👉 Entre la nouvelle version du jeu : ").strip()
    if not new_version:
        print("⚠️ Aucune version saisie. Annulation.")
        input("\nAppuie sur Entrée pour quitter...")
        return

    if new_version == old_version:
        print("ℹ️ La nouvelle version est identique à l'ancienne. Aucune modification nécessaire.")
        input("\nAppuie sur Entrée pour quitter...")
        return

    # 3. Application de la modification sans utiliser re.sub pour éviter les soucis d'escape
    try:
        with open(COMMON_FILE_PATH, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # On reconstruit exactement la ligne cible pour l'ancien et le nouveau format
        # On teste avec les guillemets doubles puis simples au cas où
        old_line_double = f'const gameVersion = "{old_version}";'
        new_line_double = f'const gameVersion = "{new_version}";'
        
        old_line_single = f"const gameVersion = '{old_version}';"
        new_line_single = f"const gameVersion = '{new_version}';"

        # Remplacement direct et sécurisé
        if old_line_double in original_content:
            new_content = original_content.replace(old_line_double, new_line_double)
        elif old_line_single in original_content:
            new_content = original_content.replace(old_line_single, new_line_single)
        else:
            # Sécurité si jamais il y a des espaces bizarres autour du égal
            print("⚠️ Format de ligne non standard. Tentative de remplacement générique...")
            pattern = r'const\s+gameVersion\s*=\s*["\']' + re.escape(old_version) + r'["\']'
            # Ici on utilise une fonction de remplacement lambda pour éviter le bug d'escape de re.sub
            new_content = re.sub(pattern, lambda m: m.group(0).replace(old_version, new_version), original_content)

        if new_content != original_content:
            with open(COMMON_FILE_PATH, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ common.js a bien été mis à jour : v{old_version} ➡️  v{new_version}")
        else:
            print("⚠️ Le remplacement n'a pas pu être appliqué (vérifie la syntaxe dans common.js).")

    except Exception as e:
        print(f"❌ Une erreur est survenue lors de l'écriture : {e}")

    input("\nAppuie sur Entrée pour quitter...")

if __name__ == '__main__':
    main()