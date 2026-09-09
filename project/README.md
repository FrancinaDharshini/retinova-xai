# Retinova

⭐ Smart healthcare AI screening platform for diabetic retinopathy workflow and clinical decision support.

## Overview

💠 Retinova is a healthcare-focused web application that supports retinal image screening using AI-assisted analysis. It helps clinical teams review fundus images, assess image quality, classify diabetic retinopathy severity, and generate explainable screening reports with a human review step.

## Features

- Retinal/fundus image upload and review
- Automated image quality checks for blur, brightness, illumination, and field visibility
- Diabetic retinopathy grading from Grade 0 to 4
- Confidence scoring and classification probabilities
- Explainable AI heatmap-style insights
- Patient and screening record tracking
- Doctor review workflow for specialist validation
- Analytics and model monitoring dashboard
- Light/dark mode interface

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide React
- ESLint

## Project Structure

```bash
project/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── public/
├── LLM/
│   ├── config.json
│   └── prompt
├── supabase/
│   └── migrations/
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
└── LICENSE (if added later)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd project
npm install
```

### Run locally

```bash
npm run dev -- --host 0.0.0.0
```

Then open:

```bash
http://localhost:5173/
```

### Production build

```bash
npm run build
```

### Preview build

```bash
npm run preview -- --host 0.0.0.0
```

## Environment Variables

For a production or connected backend setup, configure:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=
```

The app includes a demo-mode fallback when a real backend is not configured.

## Workflow

1. Upload a retinal image
2. Run image quality validation
3. Perform AI screening analysis
4. Review predicted severity and confidence
5. Inspect model reasoning output
6. Route the case for clinician review
7. Save and monitor patient screening history

## Disclaimer

This project is intended for demonstration and workflow prototyping. It is not a substitute for professional medical diagnosis or clinical decision-making.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss the proposed update.

## License

This project is for educational and prototype healthcare application use.

---

Built for smarter healthcare screening and early diabetic eye disease detection.
