# Third-party software and asset notices

OptiRoute's original-code rights notice does not cover or override third-party software, fonts, models, service terms, or other people's work. Their respective licenses continue to apply.

## Browser software and fonts

The full collected notices are published in [public/third-party-notices.txt](public/third-party-notices.txt), linked from the website's copyright page. The file includes installed runtime dependency licenses, nested vendored notices (including D3), and upstream notices for packages whose npm archive omits its root license. It is an inclusive installed-runtime inventory, not a claim that every listed package is shipped in the browser bundle.

Run `npm run notices` after installing dependencies to regenerate it from `package-lock.json`, installed packages, and the retained upstream texts in `legal/upstream/`. The production build regenerates the file automatically. Review any missing-license error rather than guessing a license. Do not delete upstream notices when updating dependencies.

| Retained upstream text | Source |
| --- | --- |
| Firebase JS SDK 13.0.0 | https://github.com/firebase/firebase-js-sdk/blob/firebase%4013.0.0/LICENSE |
| remark-math 6.0.0 | https://github.com/remarkjs/remark-math/blob/6.0.0/license |
| rehype-katex 7.0.1 | https://github.com/remarkjs/remark-math/blob/rehype-katex%407.0.1/license |
| Victory v37.3.6 (plus packaged nested vendor licenses) | https://github.com/FormidableLabs/victory/blob/v37.3.6/LICENSE.txt |
| Radio Canada Big | https://github.com/google/fonts/blob/main/ofl/radiocanadabig/OFL.txt |
| Source Serif / Source Serif Pro | https://github.com/adobe-fonts/source-serif/blob/release/LICENSE.md |
| Geist / Geist Mono (npm geist 1.3.1 source revision) | https://github.com/vercel/geist-font/blob/e444db839c07d5de21b6a7b4dbab507e40cc5bb8/LICENSE.txt |

The remote font files are used without modification. Original upstream notices remain applicable; the accompanying font-family texts supplement those notices.

## Backend and model

The backend uses third-party Python packages listed in `backend/requirements.txt`, including FastAPI, Uvicorn, HTTPX, aiosqlite, Firebase Admin, cryptography, and FastEmbed. ONNX Runtime and the MiniLM embedding model are third-party components, not OptiRoute-authored technology. The deployed ONNX model's upstream model card declares Apache-2.0: https://huggingface.co/Qdrant/all-MiniLM-L6-v2-onnx.

Retain the installed package and model licenses with server/container distributions. Before distributing backend binaries, model files, or a container image, collect the license texts for that exact build, including transitive Python dependencies and the model files. The browser inventory above is not a backend-distribution license audit.

## Team material and contributions

The project owner confirmed on 1 November 2026 that the original website design and images supplied in the project archive were created by the team. That statement records provenance; it does not assign anyone's rights or independently verify ownership. Keep original design files and any photographer/contributor permissions in the team's project records.

The added Amrit Jaiswal and Aryan Babu portraits were created with AI-assisted style editing of team-supplied photographs. Credit the supplied photographs and applicable creators when reusing them. Copyright eligibility and the extent of rights in AI-assisted material depend on applicable law; do not assume exclusive rights beyond those actually held.

Do not add an open-source license over other contributors' work without authority from the relevant rights holders. No contributor assignment or registration is created by these notices.
