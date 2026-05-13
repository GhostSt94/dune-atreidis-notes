"""
Découpe dune_leaders.jpg en 36 portraits carrés et les range par faction
dans public/leaders/<faction>/<slug>.jpg

Utilise des Y bounds EXPLICITES par ligne — chaque crop est strictement
contenu dans le périmètre de son leader, sans déborder sur les voisins.
"""

import os
from PIL import Image

SRC = "c:/Users/Dell/Desktop/projects/dune_atreides/dune_leaders.jpg"
OUT_ROOT = "c:/Users/Dell/Desktop/projects/dune_atreides/public/leaders"

im = Image.open(SRC).convert("RGB")
W, H = im.size  # 2550 x 3300

COLS = 6
ROWS = 6
cell_w = W // COLS  # 425

# Bornes Y verticales de chaque ligne (mesurées sur la colonne Atreides)
# Format: (y_top, y_bottom) — disjoints, dans l'ordre des lignes 1..6
ROW_BOUNDS = [
    (110, 500),   # ligne 1 — portrait + label (val 1-2)
    (525, 905),   # ligne 2 — (val 2-3)
    (925, 1310),  # ligne 3 — (val 4-5)
    (1335, 1660), # ligne 4 — (val 5-5)
    (1705, 2015), # ligne 5 — (val 5-6)
    (2045, 2395), # ligne 6 — (val 10 — Paul, Baron, etc.)
]

OUTPUT_SIZE = 256

# Ordre des colonnes de gauche à droite
factions = ["emperor", "guild", "atreides", "bene_gesserit", "harkonnen", "fremen"]

# Noms des leaders, par faction, top → bottom (6 par colonne)
leaders = {
    "emperor": [
        "bashar",
        "burseg",
        "caid",
        "captain-aramsham",
        "hasimir-fenring",
        "emperor-shaddam-iv",
    ],
    "guild": [
        "guild-rep",
        "guild-ambassador",
        "esmar-tuek",
        "staban-tuek",
        "master-bewt",
        "edric",
    ],
    "atreides": [
        "dr-yueh",
        "duncan-idaho",
        "gurney-halleck",
        "thufir-hawat",
        "lady-jessica",
        "paul-muaddib",
    ],
    "bene_gesserit": [
        "alia",
        "wanna-marcus",
        "princess-irulan",
        "margot-lady-fenring",
        "mother-ramallo",
        "mother-mohiam",
    ],
    "harkonnen": [
        "umman-kudu",
        "captain-iakin-nefud",
        "piter-de-vries",
        "beast-rabban",
        "feyd-rautha",
        "baron-harkonnen",
    ],
    "fremen": [
        "jamis",
        "shadout-mapes",
        "otheym",
        "chani",
        "stilgar",
        "liet-kynes",
    ],
}


def main() -> None:
    print(f"Image: {W}x{H} | column width: {cell_w}px | output: {OUTPUT_SIZE}x{OUTPUT_SIZE}")

    for col, faction in enumerate(factions):
        folder = os.path.join(OUT_ROOT, faction)
        os.makedirs(folder, exist_ok=True)

        col_x0 = col * cell_w
        col_x1 = col_x0 + cell_w

        for row in range(ROWS):
            y0, y1 = ROW_BOUNDS[row]
            row_h = y1 - y0

            # Pour produire un carré sans déformation : on prend min(largeur_colonne, hauteur_ligne)
            size = min(cell_w, row_h)

            # Centre horizontal de la colonne, vertical de la ligne
            col_cx = (col_x0 + col_x1) // 2
            row_cy = (y0 + y1) // 2

            cx0 = col_cx - size // 2
            cy0 = row_cy - size // 2
            box = (cx0, cy0, cx0 + size, cy0 + size)

            crop = im.crop(box).resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)

            name = leaders[faction][row]
            path = os.path.join(folder, f"{name}.jpg")
            crop.save(path, quality=85, optimize=True)
            print(f"  -> {faction}/{name}.jpg  box={box}  src_size={size}px")

    print("\nDone.")


if __name__ == "__main__":
    main()
