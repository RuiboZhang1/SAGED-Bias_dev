#!/usr/bin/env python3
"""
SAGED Bias Analysis Platform - New Application Launcher
Initializes backend and frontend servers with automatic dependency management
"""

import os
import sys
import time
import signal
import subprocess
import threading
import shutil
import venv
import yaml
from pathlib import Path
from typing import Optional

# Add the project root to Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(message, color=Colors.ENDC):
    print(f"{color}{message}{Colors.ENDC}")

def print_banner():
    print_colored("""
╔══════════════════════════════════════════════════════════════╗
║                SAGED Bias Analysis Platform                 ║
║                    New Application Launcher                 ║
╚══════════════════════════════════════════════════════════════╝
    """, Colors.HEADER)

class NewAppLauncher:
    def __init__(self):
        self.backend_process: Optional[subprocess.Popen] = None
        self.frontend_process: Optional[subprocess.Popen] = None
        self.project_root = Path(__file__).parent.absolute()
        self.backend_dir = self.project_root / "app_simplified" / "backend"
        self.frontend_dir = self.project_root / "app_simplified" / "frontend"
        self.venv_dir = self.project_root / "venv"
        self.settings_file = self.project_root / "settings.yaml"
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        
    def check_python_version(self) -> bool:
        """Check if Python version is >= 3.10"""
        print_colored("🐍 Checking Python version...", Colors.OKBLUE)
        
        version_info = sys.version_info
        current_version = f"{version_info.major}.{version_info.minor}.{version_info.micro}"
        
        if version_info.major >= 3 and version_info.minor >= 10:
            print_colored(f"✅ Python version {current_version} meets requirements (>= 3.10)", Colors.OKGREEN)
            return True
        else:
            print_colored(f"❌ Python version {current_version} is too old. Requires Python >= 3.10", Colors.FAIL)
            return False
    
    def create_virtual_environment(self) -> bool:
        """Create a virtual environment if it doesn't exist"""
        print_colored("🏗️ Creating virtual environment...", Colors.OKBLUE)
        
        if self.venv_dir.exists():
            print_colored("📁 Virtual environment already exists", Colors.WARNING)
            return True
            
        try:
            venv.create(self.venv_dir, with_pip=True)
            print_colored("✅ Virtual environment created successfully", Colors.OKGREEN)
            return True
        except Exception as e:
            print_colored(f"❌ Failed to create virtual environment: {e}", Colors.FAIL)
            return False
    
    def get_venv_python(self) -> str:
        """Get the path to the Python executable in the virtual environment"""
        if os.name == 'nt':  # Windows
            return str(self.venv_dir / "Scripts" / "python.exe")
        else:  # Unix/Linux/macOS
            return str(self.venv_dir / "bin" / "python")
    
    def get_venv_pip(self) -> str:
        """Get the path to pip in the virtual environment"""
        if os.name == 'nt':  # Windows
            return str(self.venv_dir / "Scripts" / "pip.exe")
        else:  # Unix/Linux/macOS
            return str(self.venv_dir / "bin" / "pip")
    
    def check_backend_dependencies(self) -> bool:
        """Check if all backend dependencies are installed"""
        print_colored("📦 Checking backend dependencies...", Colors.OKBLUE)
        
        req_file = self.backend_dir / "requirements.txt"
        if not req_file.exists():
            print_colored("❌ requirements.txt not found in backend directory", Colors.FAIL)
            return False
        
        # If virtual environment doesn't exist, dependencies are not installed
        if not self.venv_dir.exists():
            print_colored("❌ Virtual environment not found", Colors.WARNING)
            return False
        
        try:
            # Check using the virtual environment's Python
            venv_python = self.get_venv_python()
            
            # Read requirements and check each one
            with open(req_file, 'r') as f:
                requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
            
            # Test import of key packages
            test_imports = [
                "fastapi",
                "uvicorn",
                "pandas",
                "numpy"
            ]
            
            for package in test_imports:
                result = subprocess.run(
                    [venv_python, "-c", f"import {package}"],
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    print_colored(f"❌ Package {package} not found or not importable", Colors.WARNING)
                    return False
            
            print_colored("✅ All backend dependencies are installed", Colors.OKGREEN)
            return True
                
        except Exception as e:
            print_colored(f"❌ Error checking dependencies: {e}", Colors.FAIL)
            return False
    
    def install_backend_dependencies(self) -> bool:
        """Install backend dependencies in virtual environment"""
        print_colored("📦 Installing backend dependencies...", Colors.WARNING)
        
        # Create virtual environment if it doesn't exist
        if not self.create_virtual_environment():
            return False
        
        # Check if requirements.txt exists
        req_file = self.backend_dir / "requirements.txt"
        if not req_file.exists():
            print_colored("❌ requirements.txt not found in backend directory", Colors.FAIL)
            return False
        
        try:
            venv_pip = self.get_venv_pip()
            
            # Upgrade pip first
            print_colored("⬆️ Upgrading pip...", Colors.OKBLUE)
            subprocess.run(
                [venv_pip, "install", "--upgrade", "pip"],
                check=True,
                capture_output=True
            )
            
            # Install requirements
            print_colored("📦 Installing packages from requirements.txt...", Colors.OKBLUE)
            result = subprocess.run(
                [venv_pip, "install", "-r", str(req_file)],
                cwd=self.backend_dir,
                check=True,
                capture_output=True,
                text=True
            )
            
            # Install the package in development mode
            if (self.project_root / "setup.py").exists() or (self.project_root / "pyproject.toml").exists():
                print_colored("📦 Installing project package in development mode...", Colors.OKBLUE)
                subprocess.run(
                    [venv_pip, "install", "-e", "."],
                    cwd=self.project_root,
                    check=True,
                    capture_output=True,
                    text=True
                )
            
            print_colored("✅ Backend dependencies installed successfully", Colors.OKGREEN)
            return True
            
        except subprocess.CalledProcessError as e:
            print_colored(f"❌ Failed to install backend dependencies: {e}", Colors.FAIL)
            if e.stdout:
                print_colored(f"Output: {e.stdout}", Colors.FAIL)
            if e.stderr:
                print_colored(f"Error: {e.stderr}", Colors.FAIL)
            return False
        except Exception as e:
            print_colored(f"❌ Unexpected error during installation: {str(e)}", Colors.FAIL)
            return False
    
    def find_npm(self) -> Optional[str]:
        """Find npm executable"""
        npm_paths = [
            "npm",  # Try direct npm first
            r"C:\Program Files\nodejs\npm.cmd",  # Common Windows installation
            r"C:\Program Files (x86)\nodejs\npm.cmd",
            os.path.expanduser("~\\AppData\\Roaming\\npm\\npm.cmd"),  # User installation
        ]
        
        for path in npm_paths:
            try:
                result = subprocess.run(
                    [path, "--version"],
                    capture_output=True,
                    text=True,
                    check=True
                )
                print_colored(f"Found npm at: {path} (version: {result.stdout.strip()})", Colors.OKGREEN)
                return path
            except:
                continue
        return None
    
    def check_frontend_dependencies(self) -> bool:
        """Check if frontend dependencies are installed"""
        print_colored("📦 Checking frontend dependencies...", Colors.OKBLUE)
        
        node_modules_path = self.frontend_dir / "node_modules"
        package_json_path = self.frontend_dir / "package.json"
        
        if not package_json_path.exists():
            print_colored("❌ package.json not found in frontend directory", Colors.FAIL)
            return False
        
        if node_modules_path.exists():
            print_colored("✅ Frontend dependencies are installed", Colors.OKGREEN)
            return True
        else:
            print_colored("❌ Frontend dependencies not found", Colors.WARNING)
            return False
    
    def install_frontend_dependencies(self) -> bool:
        """Install frontend dependencies using npm install"""
        print_colored("📦 Installing frontend dependencies...", Colors.WARNING)
        
        npm_cmd = self.find_npm()
        if not npm_cmd:
            print_colored("❌ Could not find npm executable. Please ensure Node.js is installed", Colors.FAIL)
            return False
        
        # Check if package.json exists
        if not (self.frontend_dir / "package.json").exists():
            print_colored("❌ package.json not found in frontend directory", Colors.FAIL)
            return False
        
        try:
            # Clean install
            print_colored("🧹 Cleaning existing installations...", Colors.OKBLUE)
            node_modules = self.frontend_dir / "node_modules"
            package_lock = self.frontend_dir / "package-lock.json"
            
            if node_modules.exists():
                shutil.rmtree(node_modules)
            if package_lock.exists():
                package_lock.unlink()
            
            # Install dependencies
            print_colored("📦 Running npm install...", Colors.OKBLUE)
            result = subprocess.run(
                [npm_cmd, "install"],
                cwd=self.frontend_dir,
                check=True,
                capture_output=True,
                text=True
            )
            
            print_colored("✅ Frontend dependencies installed successfully", Colors.OKGREEN)
            return True
            
        except subprocess.CalledProcessError as e:
            print_colored(f"❌ Failed to install frontend dependencies: {e}", Colors.FAIL)
            if e.stdout:
                print_colored(f"Output: {e.stdout}", Colors.FAIL)
            if e.stderr:
                print_colored(f"Error: {e.stderr}", Colors.FAIL)
            return False
        except Exception as e:
            print_colored(f"❌ Unexpected error during installation: {str(e)}", Colors.FAIL)
            return False
    
    def start_backend_server(self) -> bool:
        """Start the backend server using the virtual environment"""
        print_colored("🚀 Starting backend server...", Colors.OKBLUE)
        
        if not (self.backend_dir / "main.py").exists():
            print_colored("❌ Backend main.py not found", Colors.FAIL)
            return False
        
        try:
            venv_python = self.get_venv_python()
            
            # Set up environment variables
            env = os.environ.copy()
            env["PYTHONPATH"] = f"{self.project_root}{os.pathsep}{self.backend_dir}"
            
            # Start the backend server
            self.backend_process = subprocess.Popen(
                [venv_python, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
                cwd=self.backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True,
                env=env
            )
            
            # Start monitoring thread
            backend_monitor = threading.Thread(target=self._monitor_backend_output)
            backend_monitor.daemon = True
            backend_monitor.start()
            
            # Wait for backend to start
            time.sleep(3)
            
            if self.backend_process.poll() is None:
                print_colored("✅ Backend server started successfully", Colors.OKGREEN)
                print_colored(f"📊 Backend API: {self.backend_url}", Colors.OKCYAN)
                print_colored(f"📋 API Docs: {self.backend_url}/docs", Colors.OKCYAN)
                return True
            else:
                print_colored("❌ Backend server failed to start", Colors.FAIL)
                return False
                
        except Exception as e:
            print_colored(f"❌ Error starting backend: {e}", Colors.FAIL)
            return False
    
    def start_frontend_server(self) -> bool:
        """Start the frontend development server"""
        print_colored("🎨 Starting frontend server...", Colors.OKBLUE)
        
        npm_cmd = self.find_npm()
        if not npm_cmd:
            print_colored("❌ Could not find npm executable", Colors.FAIL)
            return False
        
        try:
            # Start the frontend development server
            self.frontend_process = subprocess.Popen(
                [npm_cmd, "run", "dev"],
                cwd=self.frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Start monitoring thread
            frontend_monitor = threading.Thread(target=self._monitor_frontend_output)
            frontend_monitor.daemon = True
            frontend_monitor.start()
            
            # Wait for frontend to start
            time.sleep(5)
            
            if self.frontend_process.poll() is None:
                print_colored("✅ Frontend server started successfully", Colors.OKGREEN)
                return True
            else:
                print_colored("❌ Frontend server failed to start", Colors.FAIL)
                return False
                
        except Exception as e:
            print_colored(f"❌ Error starting frontend: {str(e)}", Colors.FAIL)
            return False
    
    def _monitor_backend_output(self):
        """Monitor backend process output"""
        if not self.backend_process:
            return
            
        for line in iter(self.backend_process.stdout.readline, ''):
            if line.strip():
                if "Uvicorn running on" in line:
                    print_colored(f"[BACKEND] {line.strip()}", Colors.OKGREEN)
                elif "ERROR" in line.upper():
                    print_colored(f"[BACKEND] {line.strip()}", Colors.FAIL)
                elif "WARNING" in line.upper():
                    print_colored(f"[BACKEND] {line.strip()}", Colors.WARNING)
    
    def _monitor_frontend_output(self):
        """Monitor frontend process output"""
        if not self.frontend_process:
            return
            
        try:
            for line in iter(self.frontend_process.stdout.readline, ''):
                if line.strip():
                    if "Local:" in line and "http://localhost:" in line:
                        # Extract the URL
                        parts = line.split()
                        for part in parts:
                            if part.startswith("http://localhost:"):
                                self.frontend_url = part.rstrip('/')
                                print_colored(f"🌐 Frontend: {self.frontend_url}", Colors.OKCYAN)
                                break
                    elif "ready in" in line:
                        print_colored(f"[FRONTEND] {line.strip()}", Colors.OKGREEN)
                    elif "error" in line.lower():
                        print_colored(f"[FRONTEND] {line.strip()}", Colors.FAIL)
        except UnicodeDecodeError:
            # Handle encoding errors gracefully
            pass
    
    def cleanup(self):
        """Clean up processes on exit"""
        print_colored("\n🛑 Shutting down servers...", Colors.WARNING)
        
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=5)
                print_colored("✅ Frontend server stopped", Colors.OKGREEN)
            except:
                self.frontend_process.kill()
                print_colored("🔨 Frontend server force killed", Colors.WARNING)
        
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
                print_colored("✅ Backend server stopped", Colors.OKGREEN)
            except:
                self.backend_process.kill()
                print_colored("🔨 Backend server force killed", Colors.WARNING)
        
        print_colored("👋 Goodbye!", Colors.HEADER)
    
    def initialize_backend(self) -> bool:
        """Initialize backend server with dependency management"""
        print_colored("🔧 Initializing Backend Server...", Colors.HEADER)
        
        # Step 1: Check if all dependencies are installed
        if not self.check_backend_dependencies():
            # Step 2: Create a venv, check python version must > 3.10, then install the package using pip
            if not self.check_python_version():
                return False
            
            if not self.install_backend_dependencies():
                return False
        
        # Step 3: Try start the server
        return self.start_backend_server()
    
    def initialize_frontend(self) -> bool:
        """Initialize frontend server with dependency management"""
        print_colored("🔧 Initializing Frontend Server...", Colors.HEADER)
        
        # Step 1: Check frontend dependencies
        if not self.check_frontend_dependencies():
            # Step 2: If not installed, run "npm install"
            if not self.install_frontend_dependencies():
                return False
        
        # Step 3: run "npm run dev"
        return self.start_frontend_server()
    
    def check_settings_file(self) -> bool:
        """Check if settings.yaml file exists"""
        print_colored("⚙️ Checking for settings.yaml file...", Colors.OKBLUE)
        
        if self.settings_file.exists():
            print_colored("✅ settings.yaml file found", Colors.OKGREEN)
            return True
        else:
            print_colored("❌ settings.yaml file not found", Colors.WARNING)
            return False
    
    def prompt_for_api_key(self) -> str:
        """Prompt user for API key input"""
        print_colored("\n🔑 API Key Configuration Required", Colors.HEADER)
        print_colored("=" * 50, Colors.HEADER)
        print_colored("To use the SAGED platform, you need to provide a DASHSCOPE API key.", Colors.OKBLUE)
        print_colored("This key will be used for both deepseek-r1-distill-qwen-1.5b and qwen-turbo-latest models.", Colors.OKBLUE)
        print("")
        
        while True:
            api_key = input("Please enter your DASHSCOPE API key (starts with 'sk-'): ").strip()
            
            if not api_key:
                print_colored("❌ API key cannot be empty. Please try again.", Colors.FAIL)
                continue
            
            return api_key
    
    def generate_settings_file(self, api_key: str) -> bool:
        """Generate settings.yaml file with the provided API key"""
        print_colored("📝 Generating settings.yaml file...", Colors.OKBLUE)
        
        settings_content = {
            'deepseek-r1-distill-qwen-1.5b': {
                'DASHSCOPE_API_KEY': api_key
            },
            'qwen-turbo-latest': {
                'DASHSCOPE_API_KEY': api_key
            }
        }
        
        try:
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                yaml.dump(settings_content, f, default_flow_style=False, indent=4)
            
            print_colored("✅ settings.yaml file generated successfully", Colors.OKGREEN)
            print_colored(f"📁 File location: {self.settings_file}", Colors.OKCYAN)
            return True
            
        except Exception as e:
            print_colored(f"❌ Failed to generate settings.yaml: {e}", Colors.FAIL)
            return False
    
    def setup_settings_file(self) -> bool:
        """Setup settings.yaml file if it doesn't exist"""
        if not self.check_settings_file():
            print_colored("🔧 Setting up configuration file...", Colors.HEADER)
            
            api_key = self.prompt_for_api_key()
            
            if not self.generate_settings_file(api_key):
                return False
            
            print_colored("✅ Configuration setup completed", Colors.OKGREEN)
        
        return True
    
    def run(self):
        """Main execution function"""
        print_banner()
        
        # Check basic requirements
        if not self.backend_dir.exists():
            print_colored(f"❌ Backend directory not found: {self.backend_dir}", Colors.FAIL)
            return
        
        if not self.frontend_dir.exists():
            print_colored(f"❌ Frontend directory not found: {self.frontend_dir}", Colors.FAIL)
            return
        
        try:
            # Target 1: Initialize Backend Server
            if not self.initialize_backend():
                print_colored("❌ Failed to initialize backend", Colors.FAIL)
                return
            
            # Target 2: Initialize Frontend
            if not self.initialize_frontend():
                print_colored("❌ Failed to initialize frontend", Colors.FAIL)
                # self.cleanup()
                return
            
            # Target 3: Setup settings.yaml file
            if not self.setup_settings_file():
                print_colored("❌ Failed to setup settings file", Colors.FAIL)
                self.cleanup()
                return
            
            # Success message
            print_colored("\n" + "="*60, Colors.OKGREEN)
            print_colored("🎉 SAGED Platform is running successfully!", Colors.OKGREEN)
            print_colored("="*60, Colors.OKGREEN)
            print_colored(f"📊 Backend API: {self.backend_url}", Colors.OKCYAN)
            print_colored(f"📋 API Documentation: {self.backend_url}/docs", Colors.OKCYAN)
            print_colored(f"🌐 Frontend App: {self.frontend_url}", Colors.OKCYAN)
            print_colored(f"⚙️ Settings File: {self.settings_file}", Colors.OKCYAN)
            print_colored("="*60, Colors.OKGREEN)
            print_colored("💡 Press Ctrl+C to stop all servers", Colors.WARNING)
            print_colored("="*60 + "\n", Colors.OKGREEN)
            
            # Keep the main process alive and monitor services
            try:
                while True:
                    time.sleep(1)
                    # Check if processes are still running
                    if self.backend_process and self.backend_process.poll() is not None:
                        print_colored("❌ Backend process died unexpectedly", Colors.FAIL)
                        break
                    if self.frontend_process and self.frontend_process.poll() is not None:
                        print_colored("❌ Frontend process died unexpectedly", Colors.FAIL)
                        break
            except KeyboardInterrupt:
                pass
                
        except Exception as e:
            print_colored(f"❌ Unexpected error: {e}", Colors.FAIL)
        finally:
            self.cleanup()

if __name__ == "__main__":
    launcher = NewAppLauncher()
    launcher.run() 