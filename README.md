# SVG Animáció Generátor

Egy teljes webes alkalmazás Python Flask backend-del és Manim könyvtárral, amely lehetővé teszi SVG fájlok feltöltését és valódi animációs videók generálását.

## 🎯 **Rendszerkövetelmények**

- **Python 3.8+** (ajánlott: Python 3.10)
- **FFmpeg** (Manim videó generáláshoz)
- **Modern webböngésző** (Chrome, Firefox, Safari, Edge)

## 🚀 **Gyors Indítás**

### 1. **Python Backend Telepítése**

```bash
# Klónozd le a projektet
cd SVGAnim

# Python függőségek telepítése
pip install -r requirements.txt

# FFmpeg telepítése (Windows - Chocolatey)
choco install ffmpeg
```

### 2. **Backend Indítása**

**Windows:**
```bash
# Futtatd a batch fájlt
start.bat
```


### 3. **Webalkalmazás Használata**

1. Indítsd el a `start.bat` fájlt
2. Nyisd meg a böngészőben: [http://localhost:5000](http://localhost:5000)
4. Válaszd ki a kívánt fület (SVG feltöltés vagy Minecraft Itemek)
5. Töltsd fel az SVG fájlt **vagy** válassz egy Minecraft itemet a beépített böngészőből
6. Állítsd be az animáció paramétereit (időtartam, háttérszín)
7. Kattints az "Animáció Generálása" gombra
8. Nézd meg az élő előnézetet, majd töltsd le a kész videót!


## 🎨 **Funkciók és Újdonságok**

### **Főbb Jellemzők**
- **Manim renderelés**: A backend Python-ban futtatja a Manim könyvtárat
- **Full HD videó**: 1920x1080 felbontás MP4 formátumban
- **Testreszabható beállítások**:
  - Animáció időtartama (1-10 másodperc)
  - Háttérszín választás (modern színválasztó, színkód szerkesztéssel)
- **Élő SVG előnézet**: Feltöltés vagy kiválasztás után azonnal
- **Videó előnézet**: Generált animáció lejátszása böngészőben
- **Minecraft Itemek böngésző**: Beépített keresővel, előnézettel és kiválasztással
- **Modern, tabosított felület**: SVG feltöltés és Minecraft itemek külön fülön
- **Reszponzív, magyar nyelvű UI**: Sötét téma, letisztult elrendezés, mobil támogatás
- **Automatikus fájlkezelés**: Feltöltött és generált fájlok automatikus törlése idővel


## 🔧 **Technikai Részletek**

### **Architektúra**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python Flask REST API
- **Renderelés**: Manim könyvtár
- **Videó formátum**: MP4, 1920x1080, 60fps


### **Generált Manim Kód**
A backend a következő, egyszerű template alapján generálja a kódot:

```python
from manim import *

class logo_animation(Scene):
    def construct(self):
        self.camera.background_color = "#000000"  # háttérszín
        m = SVGMobject("full/path/to_image").shift(UP)
        self.play(Write(m, run_time=2))
        self.wait(2)
```

## 🛠 **Hibaelhárítás**


### **Backend Problémák**

**"Manim rendering failed"**
- Telepítsd az FFmpeg-et
- Ellenőrizd a Python és Manim telepítését:
  ```bash
  python -c "import manim; print('Manim OK')"
  ```

**"SVG file not found"**
- Győződj meg róla, hogy az SVG fájl érvényes
- Próbálj újra feltölteni vagy válassz másik itemet

### **Frontend Problémák**

**"Fájl feltöltése sikertelen"**
- Csak `.svg` fájlokat használj vagy válassz Minecraft itemet
- Ellenőrizd a fájl méretét (max ~10MB ajánlott)
- Próbálj másik SVG fájlt vagy itemet

**"Video file not found"**
- Várj, amíg a renderelés befejeződik
- Ellenőrizd a backend logokat
- Próbáld újra generálni

### **Teljesítmény Optimalizálás**
- **Egyszerű SVG-k**: Kevesebb path elem = gyorsabb renderelés
- **Megfelelő hardver**: Manim CPU-igényes, több mag ajánlott

## Licenc

Ez a projekt az MIT licenc alatt áll. A Manim könyvtár szintén MIT licencű.

Az engedélyező nyilatkozatot lásd a LICENSE fájlban.

---

**Jó animálást! 🎬✨**
