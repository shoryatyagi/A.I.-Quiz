# Ollama Local LLM Integration

## Overview

You can now choose between **Google Gemini** (cloud-based) and **Ollama** (local LLM) for quiz generation. This gives you the flexibility to use either cloud AI or run models locally on your machine.

## What is Ollama?

Ollama is a tool that lets you run large language models (LLMs) locally on your machine. It's free, private, and doesn't require an internet connection once models are downloaded.

## Installation

### Windows

```powershell
# Download and install Ollama from:
https://ollama.com/download

# Or use winget:
winget install Ollama.Ollama
```

### MacOS

```bash
# Download from website or use brew:
brew install ollama
```

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Setup Steps

### 1. Install Ollama

Follow the installation instructions above for your operating system.

### 2. Start Ollama Server

```bash
ollama serve
```

The server will start on `http://localhost:11434`

### 3. Pull a Model

Download a model to use (first time only):

```bash
# Recommended models:

# Llama 2 (7B) - Good balance of speed and quality
ollama pull llama2

# Mistral (7B) - Fast and efficient
ollama pull mistral

# Llama 3 (8B) - Latest and improved
ollama pull llama3

# CodeLlama - Best for technical content
ollama pull codellama
```

### 4. Verify Installation

```bash
# List installed models
ollama list

# Test a model
ollama run llama2 "Hello, how are you?"
```

### 5. Configure Environment Variables

Already set in `.env.local`:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

Change `OLLAMA_MODEL` to match the model you downloaded.

## Usage

### In AI Quiz Generator

1. Click "Generate Quiz with AI"
2. Select **AI Model** dropdown
3. Choose **"Ollama (Local)"**
4. Enter your topic and generate

### In PDF Upload

1. Upload your PDF
2. Select **AI Model** dropdown
3. Choose **"Ollama (Local)"**
4. Generate quiz

## Comparison: Gemini vs Ollama

| Feature        | Google Gemini                | Ollama                    |
| -------------- | ---------------------------- | ------------------------- |
| **Location**   | Cloud (Google)               | Local Machine             |
| **Internet**   | Required                     | Not Required\*            |
| **Privacy**    | Data sent to Google          | Fully Private             |
| **Speed**      | Fast (depends on connection) | Depends on your hardware  |
| **Cost**       | Free tier + paid             | Completely Free           |
| **Setup**      | API Key only                 | Install + Download models |
| **Quality**    | Very High                    | Good to Very High         |
| **Model Size** | N/A                          | 4GB - 70GB+               |

\*Internet only needed to download models initially

## Recommended Models

### For Quiz Generation

1. **llama2** (Default)

   - Size: 3.8GB
   - Speed: Fast
   - Quality: Good
   - Best for: General quiz generation

2. **llama3**

   - Size: 4.7GB
   - Speed: Fast
   - Quality: Very Good
   - Best for: Improved reasoning and accuracy

3. **mistral**

   - Size: 4.1GB
   - Speed: Very Fast
   - Quality: Good
   - Best for: Quick quiz generation

4. **codellama**
   - Size: 3.8GB
   - Speed: Fast
   - Quality: Excellent for code
   - Best for: Programming quizzes

### For Better Quality (Requires More RAM)

5. **llama2:13b**

   - Size: 7.4GB
   - Speed: Slower
   - Quality: Very Good

6. **llama3:70b**
   - Size: 40GB
   - Speed: Slow
   - Quality: Excellent
   - Requires: 64GB+ RAM

## Hardware Requirements

### Minimum

- **RAM:** 8GB
- **Storage:** 10GB free
- **CPU:** Modern quad-core
- **Model:** llama2, mistral

### Recommended

- **RAM:** 16GB+
- **Storage:** 20GB+ free
- **CPU:** Modern 8-core
- **GPU:** Optional but helpful
- **Model:** llama3, codellama

### High-End

- **RAM:** 32GB+
- **Storage:** 50GB+ free
- **GPU:** NVIDIA with 8GB+ VRAM
- **Model:** llama3:70b, mixtral:8x7b

## Troubleshooting

### Error: "Ollama API Error: Make sure Ollama is running"

**Solution:**

1. Check if Ollama is running: `ollama list`
2. Start Ollama: `ollama serve`
3. Verify URL: `http://localhost:11434`

### Error: "Model not found"

**Solution:**

1. Pull the model: `ollama pull llama2`
2. Check installed models: `ollama list`
3. Update `.env.local` with correct model name

### Slow Generation

**Solution:**

1. Use a smaller model (llama2 instead of llama3:70b)
2. Close other applications
3. Check RAM usage
4. Consider using Gemini for faster results

### Out of Memory

**Solution:**

1. Use a smaller model
2. Close other applications
3. Restart Ollama: `ollama serve`
4. Use Gemini instead for large quizzes

## Switching Between Models

### Change Default Model

Edit `.env.local`:

```bash
OLLAMA_MODEL=mistral  # Change to your preferred model
```

### Available Models

Run to see all available models:

```bash
ollama list
```

Pull more models:

```bash
ollama pull <model-name>
```

## Performance Tips

1. **Keep Ollama Running:** Start `ollama serve` once and leave it running
2. **Pre-load Models:** Run `ollama run llama2` once to cache the model in memory
3. **Use SSD:** Install models on SSD for faster loading
4. **Close Apps:** Close unnecessary applications to free up RAM
5. **GPU Acceleration:** If you have an NVIDIA GPU, Ollama will automatically use it

## Privacy Benefits

- ✅ All quiz generation happens locally
- ✅ PDF content never leaves your machine
- ✅ No data sent to external APIs
- ✅ No API keys or accounts needed
- ✅ Works offline (after model download)

## When to Use Each

### Use Gemini (Cloud) When:

- You want fastest generation
- You have good internet
- You don't have powerful hardware
- You need highest quality

### Use Ollama (Local) When:

- Privacy is important
- You have no/slow internet
- You have good hardware (16GB+ RAM)
- You want zero cost
- You want to customize models

## Files Modified

1. **src/lib/openai.js**

   - Added `generateWithOllama()` function
   - Updated `generateQuizFromText()` to accept model parameter
   - Updated `generateQuizFromPrompt()` to accept model parameter

2. **src/components/AIQuizGenerator.js**

   - Added AI model selection dropdown
   - Sends model choice to API

3. **src/components/PDFChunkUploader.js**

   - Added AI model selection dropdown
   - Sends model choice to API

4. **src/app/api/generate-quiz/route.js**

   - Accepts model parameter
   - Passes to generation function

5. **src/app/api/generate-quiz-from-pdf-chunks/route.js**

   - Accepts model parameter
   - Passes to generation function

6. **.env.local**
   - Added `OLLAMA_BASE_URL`
   - Added `OLLAMA_MODEL`

## Testing

### Test Ollama Installation

```bash
ollama run llama2 "Generate a quiz question about Python programming"
```

### Test in Application

1. Start your Next.js app
2. Go to AI Quiz Generator
3. Select "Ollama (Local)"
4. Enter a simple topic
5. Generate quiz

## Support & Resources

- **Ollama Website:** https://ollama.com
- **Model Library:** https://ollama.com/library
- **Documentation:** https://github.com/ollama/ollama
- **Discord:** https://discord.gg/ollama

## Quick Reference

```bash
# Install Ollama
# Visit: https://ollama.com/download

# Start Ollama
ollama serve

# Pull a model
ollama pull llama2

# List models
ollama list

# Test model
ollama run llama2 "Hello"

# Remove model
ollama rm llama2
```

## Environment Variables Summary

```bash
# Google Gemini (Cloud)
GEMINI_API_KEY=your_api_key_here

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

Choose the model in the UI - no need to change code!
