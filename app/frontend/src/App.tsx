import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BenchmarkConfig from './pages/BenchmarkConfig';
import MetadataRepository from './pages/MetadataRepository';
import Analysis from './pages/Analysis';
import Navigation from './components/Navigation';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6B4E71', // Deep lavender
      light: '#9B7BA0',
      dark: '#4A3A4E',
    },
    secondary: {
      main: '#B19CD9', // Light purple
      light: '#D4C5E8',
      dark: '#8A6DB3',
    },
    background: {
      default: '#F8F6FA', // Very light lavender
      paper: '#FFFFFF',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#6B4E71', // Deep lavender
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/benchmark" element={<BenchmarkConfig />} />
              <Route path="/metadata" element={<MetadataRepository />} />
              <Route path="/analysis" element={<Analysis />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 