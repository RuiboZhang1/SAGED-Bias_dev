# SAGED: A Holistic Bias-Benchmarking Pipeline for Language Models

[![ArXiv](https://img.shields.io/badge/ArXiv-2409.11149-red)](https://arxiv.org/abs/2409.11149)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10+-green) 
![React](https://img.shields.io/badge/react-18+-blue) 
![FastAPI](https://img.shields.io/badge/FastAPI-latest-green)

**Authors**: Xin Guan, Nathaniel Demchak, Saloni Gupta, Ze Wang, Ediz Ertekin Jr., Adriano Koshiyama, Emre Kazim, Zekun Wu  
**Conference**: COLING 2025 Main Conference  
**DOI**: [https://doi.org/10.48550/arXiv.2409.11149](https://doi.org/10.48550/arXiv.2409.11149)

---

## Overview

SAGED-Bias is a comprehensive benchmarking pipeline designed to detect and mitigate bias in large language models. It provides both a powerful Python library and a modern web-based platform for bias analysis, addressing limitations in existing benchmarks such as narrow scope, contamination, and lack of fairness calibration.

The SAGED methodology implements a systematic 5-stage approach:
1. **Scraping Materials**: Collects and processes benchmark data from various sources
2. **Assembling Benchmarks**: Creates structured benchmarks with contextual considerations
3. **Generating Responses**: Produces language model outputs for evaluation
4. **Extracting Features**: Extracts numerical and textual features from responses
5. **Diagnosing Bias**: Applies various disparity metrics with baseline comparisons

## Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 16+** with npm
- **Git** for version control

### One-Command Setup

```bash
# Clone the repository
git clone <repository-url>
cd SAGED-Bias

# Start the application (automatically handles setup)
python app_launcher.py
```

The `app_launcher.py` script will automatically:
- Check Python version compatibility
- Create and configure virtual environment
- Install all dependencies
- Configure API keys (if needed)
- Start both backend (port 8000) and frontend (port 3000) servers

### Access Points
- 🌐 **Web Application**: http://localhost:3000
- 📚 **API Documentation**: http://localhost:8000/docs


## Citation

If you use SAGED in your work, please cite the following paper:

```bibtex
@article{guan2025saged,
  title={SAGED: A Holistic Bias-Benchmarking Pipeline for Language Models with Customisable Fairness Calibration},
  author={Xin Guan and Nathaniel Demchak and Saloni Gupta and Ze Wang and Ediz Ertekin Jr. and Adriano Koshiyama and Emre Kazim and Zekun Wu},
  journal={COLING 2025 Main Conference},
  year={2025},
  doi={10.48550/arXiv.2409.11149}
}
```

## License

MIT License - see [LICENSE](LICENSE) file for details. 