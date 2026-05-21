# v1.0
import os
import shutil

# --- CONFIGURATION DES CHEMINS ---
GAME_RAW_DATA = r"C:\Program Files (x86)\Steam\steamapps\common\Shape of Dreams\RawData"

GRADIENTS_SRC = os.path.join(GAME_RAW_DATA, "gradients.json")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_ASSETS = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "assets"))

LOCALES_DEST = os.path.join(SITE_ASSETS, "data", "locales")
GRADIENTS_DEST = os.path.join(LOCALES_DEST, "gradients.json")

LOCALES_TO_COPY = [
    'de-DE', 'en-US', 'es-MX', 'fr-FR', 'it-IT', 'ja-JP', 
    'ko-KR', 'pl-PL', 'pt-BR', 'ru-RU', 'tr-TR', 'zh-CN', 'zh-TW'
]

IMAGES_SRC = os.path.join(GAME_RAW_DATA, "!Images")
IMAGES_DEST = os.path.join(SITE_ASSETS, "game", "images")

SPRITES_SRC = os.path.join(GAME_RAW_DATA, "!Sprites")
SPRITES_DEST = os.path.join(SITE_ASSETS, "game", "sprites")

# Ajout des chemins pour l'étape 4 (ModResources)
MOD_RESOURCES_SRC = os.path.join(GAME_RAW_DATA, "!ModResources")
MOD_RESOURCES_DEST = os.path.join(SITE_ASSETS, "game", "ModResources")


def reset_and_copy(src_dir, dest_dir):
    """Supprime le dossier de destination s'il existe (écrase tout) et copie le dossier source."""
    if os.path.exists(dest_dir):
        print(f"[Nettoyage] Suppression de l'ancien dossier : {dest_dir}")
        shutil.rmtree(dest_dir)
        
    if os.path.exists(src_dir):
        shutil.copytree(src_dir, dest_dir)
        print(f" ✓ Copie réussie de : {os.path.basename(src_dir)}")
    else:
        print(f" ❌ Erreur : Le dossier source n'existe pas : {src_dir}")


def main():
    print("🚀 Début de la mise à jour des données du Wiki...\n")

    # --- ÉTAPE 1 : LOCALES & GRADIENTS ---
    print("--- Étape 1 : Importation des locales et du fichier gradients ---")
    if os.path.exists(LOCALES_DEST):
        print(f"[Nettoyage] Suppression de l'ancien dossier locales : {LOCALES_DEST}")
        shutil.rmtree(LOCALES_DEST)
    os.makedirs(LOCALES_DEST, exist_ok=True)

    locales_copied = 0
    for locale in LOCALES_TO_COPY:
        src_locale = os.path.join(GAME_RAW_DATA, locale)
        dest_locale = os.path.join(LOCALES_DEST, locale)
        
        if os.path.exists(src_locale):
            shutil.copytree(src_locale, dest_locale)
            print(f" ✓ Locale copiée : ${locale}")
            locales_copied += 1
        else:
            print(f" ⚠️ Dossier locale introuvable dans le jeu : {locale}")
            
    if os.path.exists(GRADIENTS_SRC):
        shutil.copy2(GRADIENTS_SRC, GRADIENTS_DEST)
        print(" ✓ Fichier 'gradients.json' copié avec succès dans locales.")
    else:
        print(f" ⚠️ Fichier source introuvable : {GRADIENTS_SRC}")
        
    print(f"> Fin Étape 1 : {locales_copied} dossier(s) de langue et 1 fichier copiés.\n")

    # --- ÉTAPE 2 : IMAGES ---
    print("--- Étape 2 : Récupération des images ---")
    reset_and_copy(IMAGES_SRC, IMAGES_DEST)
    print("> Fin Étape 2\n")

    # --- ÉTAPE 3 : SPRITES ---
    print("--- Étape 3 : Récupération des sprites ---")
    reset_and_copy(SPRITES_SRC, SPRITES_DEST)
    print("> Fin Étape 3\n")

    # --- ÉTAPE 4 : MOD RESOURCES ---
    print("--- Étape 4 : Récupération des ressources de modding ---")
    reset_and_copy(MOD_RESOURCES_SRC, MOD_RESOURCES_DEST)
    print("> Fin Étape 4\n")

    print("🎉 Wiki mis à jour avec succès !")


if __name__ == "__main__":
    main()