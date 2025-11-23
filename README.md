# 🏷️ LabelStudio

LabelStudio is a modern web application for designing, generating, and printing professional QR code labels. It features AI-powered tools, custom QR designs (with logos), and export options for both standard printers and laser cutters.

[View Demo](https://labelstudio.netlify.app/) . [Report Bug]() . [Request Feature]()


![Design Interface](https://github.com/namalchamodya/LabelStudio/blob/main/public/ss1.png)
![Design Interface](https://github.com/namalchamodya/LabelStudio/blob/main/public/ss2.png)
![Design Interface](https://github.com/namalchamodya/LabelStudio/blob/main/public/ss3.png)

## Key Features


 ### Powerful Design Tools

- Visual Editor: Drag-and-drop Text, Rectangles, Images, and QR Codes.

- Layer Management: Reorder elements with a dedicated layers panel (Move to Front/Back/Up/Down).

- Rich Text: Customize fonts, weights (Bold/Italic), and text decoration (Underline).

### Advanced QR Generation

- Starbucks-Style QRs: Generates aesthetic QR codes with circular dots.

- Embedded Logos: Automatically calculates a "safe zone" in the center of the QR code to embed your logo without breaking scanability.

- High Reliability: Uses 'H' (High) Error Correction to ensure robustness.

### Production Ready

- Smart Printing: Automatically calculates grid layouts for A4, A3, and US Letter paper sizes.

- Multi-Page PDF: Generates clean, multi-page PDFs for standard office printers.

- Laser Cutting Export: Exports to ```.svg``` with industry-standard Red Hairline (0.1mm) cuts and Black fills for engraving. Compatible with LightBurn, RDWorks, etc.

-  Mobile Friendly: Fully responsive interface for designing on phones or tablets.
  
-  Batch Data: Generate sequences (e.g., ITEM-001 to ITEM-050) automatically.

## How to Run

1. **Clone the repository**
 <br> git clone [https://github.com/namalchamodya/LabelStudio.git](https://github.com/namalchamodya/LabelStudio.git)
</br>  ```cd LabelStudio``` 
2. **Install Dependencies**
 <br>Install the required libraries (React, QR Code, Lucide, etc.):
<br>```npm install```
3. **Configure Environment Variables**
   <br>Create a new file named ```.env``` in the root folder of your project. Paste your API key inside it like this:
   <br>```VITE_GEMINI_API_KEY=your_google_gemini_api_key_here```
4. **Start the App**
   <br>Run the development server:
   <br>```npm run dev```
   <br>The app should now be running at ```http://localhost:5173```.
   
## License

Distributed under the ```MIT``` License. See LICENSE for more information.

## Author

Namal Chamodya <br>
- Website: website.com <br>
- fb: [@na_mal_chamo_d_ya](https://www.facebook.com/namal.chamodya.2025) <br>
- insta: [@na_mal_chamo_d_ya](https://www.instagram.com/na_mal_chamo_d_ya/) <br>




