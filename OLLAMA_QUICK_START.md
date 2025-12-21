# Ollama Quick Start

## 1. Install Ollama

**Windows:** Download from https://ollama.com/download  
**Mac:** `brew install ollama`  
**Linux:** `curl -fsSL https://ollama.com/install.sh | sh`

## 2. Start Server

```bash
ollama serve
```

## 3. Download a Model

```bash
ollama pull llama2
```

## 4. Use in App

1. Open AI Quiz Generator or PDF Upload
2. Select **"Ollama (Local)"** from AI Model dropdown
3. Generate quiz!

## Model Recommendations

- **llama2** - Default, fast, 8GB RAM
- **llama3** - Better quality, 16GB RAM
- **mistral** - Fastest, 8GB RAM
- **codellama** - For programming, 8GB RAM

## Environment Variables

Already configured in `.env.local`:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## Common Commands

```bash
ollama list              # Show installed models
ollama pull <model>      # Download a model
ollama rm <model>        # Remove a model
ollama run <model>       # Test a model
```

## Troubleshooting

- **"Ollama API Error"** → Run `ollama serve`
- **"Model not found"** → Run `ollama pull llama2`
- **Slow generation** → Use smaller model or close apps
- **Out of memory** → Use Gemini instead

## Gemini vs Ollama

|              | Gemini              | Ollama              |
| ------------ | ------------------- | ------------------- |
| **Location** | Cloud               | Local               |
| **Privacy**  | Data sent to Google | Fully private       |
| **Speed**    | Fast                | Depends on hardware |
| **Cost**     | Free tier           | Completely free     |
| **Setup**    | API key             | Install + model     |

## Need Help?

See full guide: `OLLAMA_SETUP_GUIDE.md`
