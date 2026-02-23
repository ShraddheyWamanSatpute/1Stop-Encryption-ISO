"use client"

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  useTheme,
} from '@mui/material';

interface SimpleCalculatorWidgetProps {
  onClose?: () => void;
}

const SimpleCalculatorWidget: React.FC<SimpleCalculatorWidgetProps> = () => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonSize, setButtonSize] = useState(56);

  // Calculator state
  const [display, setDisplay] = useState('0');
  const [pendingOperator, setPendingOperator] = useState<string | null>(null);
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // Input handling
  const inputNumber = useCallback((num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForOperand]);

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setPendingOperator(null);
    setPendingValue(null);
    setWaitingForOperand(false);
  }, []);

  const backspace = useCallback(() => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display]);

  const performOperation = useCallback((nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (pendingValue === null) {
      setPendingValue(inputValue);
    } else if (pendingOperator) {
      const currentValue = pendingValue || 0;
      const newValue = calculate(currentValue, inputValue, pendingOperator);

      setDisplay(String(newValue));
      setPendingValue(newValue);
    }

    setWaitingForOperand(true);
    setPendingOperator(nextOperator);
  }, [display, pendingValue, pendingOperator]);

  const performEquals = useCallback(() => {
    const inputValue = parseFloat(display);

    if (pendingValue !== null && pendingOperator) {
      const newValue = calculate(pendingValue, inputValue, pendingOperator);
      
      setDisplay(String(newValue));
      setPendingValue(null);
      setPendingOperator(null);
      setWaitingForOperand(true);
    }
  }, [display, pendingValue, pendingOperator]);

  const calculate = (firstValue: number, secondValue: number, operator: string): number => {
    switch (operator) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '×': return firstValue * secondValue;
      case '÷': return secondValue !== 0 ? firstValue / secondValue : 0;
      default: return secondValue;
    }
  };

  const toggleSign = useCallback(() => {
    if (display !== '0') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    }
  }, [display]);

  // Calculate button size based on container width
  useEffect(() => {
    const calculateButtonSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Account for padding (8px each side = 16px) and gaps (3 gaps * 6px = 18px)
        const availableWidth = containerWidth - 16 - 18;
        // 4 buttons per row
        const calculatedSize = Math.floor(availableWidth / 4);
        // Minimum size of 40px, maximum of 80px
        const clampedSize = Math.max(40, Math.min(80, calculatedSize));
        setButtonSize(clampedSize);
      }
    };

    calculateButtonSize();
    const resizeObserver = new ResizeObserver(calculateButtonSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key >= '0' && event.key <= '9') {
        inputNumber(event.key);
      } else if (event.key === '.') {
        inputDecimal();
      } else if (event.key === 'Enter' || event.key === '=') {
        performEquals();
      } else if (event.key === 'Escape') {
        clearAll();
      } else if (event.key === 'Backspace') {
        backspace();
      } else if (['+', '-', '*', '/'].includes(event.key)) {
        const operator = event.key === '*' ? '×' : event.key === '/' ? '÷' : event.key;
        performOperation(operator);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [display, pendingOperator, pendingValue, waitingForOperand, inputNumber, inputDecimal, performEquals, clearAll, backspace, performOperation]);

  // Memoize button styles
  const buttonStyles = useMemo(() => {
    const fontSize = Math.max(0.9, Math.min(1.3, buttonSize / 50));
    const baseStyle = {
      height: `${buttonSize}px`,
      width: `${buttonSize}px`,
      minWidth: `${buttonSize}px`,
      maxWidth: `${buttonSize}px`,
      fontSize: `${fontSize}rem`,
      fontWeight: 600,
      borderRadius: '50%',
      textTransform: 'none' as const,
      transition: 'all 0.15s ease-in-out',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
      },
      '&:active': {
        transform: 'translateY(0px)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      },
    };

    return {
      number: {
        ...baseStyle,
        backgroundColor: '#f5f5f5',
        color: theme.palette.text.primary,
        '&:hover': {
          ...baseStyle['&:hover'],
          backgroundColor: '#e0e0e0',
        },
      },
      operator: {
        ...baseStyle,
        backgroundColor: theme.palette.primary.main,
        color: '#ffffff',
        '&:hover': {
          ...baseStyle['&:hover'],
          backgroundColor: theme.palette.primary.dark,
        },
      },
      special: {
        ...baseStyle,
        backgroundColor: '#ff5252',
        color: '#ffffff',
        '&:hover': {
          ...baseStyle['&:hover'],
          backgroundColor: '#ff1744',
        },
      },
      equals: {
        ...baseStyle,
        backgroundColor: '#4caf50',
        color: '#ffffff',
        '&:hover': {
          ...baseStyle['&:hover'],
          backgroundColor: '#43a047',
        },
      },
    };
  }, [theme, buttonSize]);

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        height: '100%', 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        p: 1, 
        gap: 0.75,
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: '#fafafa',
        alignItems: 'center',
      }}
    >
      {/* Display */}
      <TextField
        fullWidth
        variant="outlined"
        value={display}
        InputProps={{
          readOnly: true,
          style: {
            textAlign: 'right',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            backgroundColor: '#263238',
            color: '#ffffff',
            borderRadius: 2,
            padding: '16px',
            fontFamily: 'monospace',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          },
        }}
        sx={{
          maxWidth: '100%',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              border: 'none',
            },
          },
        }}
      />
      
      {/* Button Grid */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 0.75,
        minHeight: 0,
        width: '100%',
      }}>
        {/* Row 1: C, ⌫, ÷ */}
        <Box sx={{ display: 'flex', gap: 0.75, flex: '0 0 auto', justifyContent: 'center' }}>
          <Button onClick={clearAll} sx={buttonStyles.special}>C</Button>
          <Button onClick={backspace} sx={buttonStyles.special}>⌫</Button>
          <Button onClick={() => performOperation('÷')} sx={buttonStyles.operator}>÷</Button>
        </Box>

        {/* Row 2: 7, 8, 9, × */}
        <Box sx={{ display: 'flex', gap: 0.75, flex: '0 0 auto', justifyContent: 'center' }}>
          <Button onClick={() => inputNumber('7')} sx={buttonStyles.number}>7</Button>
          <Button onClick={() => inputNumber('8')} sx={buttonStyles.number}>8</Button>
          <Button onClick={() => inputNumber('9')} sx={buttonStyles.number}>9</Button>
          <Button onClick={() => performOperation('×')} sx={buttonStyles.operator}>×</Button>
        </Box>

        {/* Row 3: 4, 5, 6, - */}
        <Box sx={{ display: 'flex', gap: 0.75, flex: '0 0 auto', justifyContent: 'center' }}>
          <Button onClick={() => inputNumber('4')} sx={buttonStyles.number}>4</Button>
          <Button onClick={() => inputNumber('5')} sx={buttonStyles.number}>5</Button>
          <Button onClick={() => inputNumber('6')} sx={buttonStyles.number}>6</Button>
          <Button onClick={() => performOperation('-')} sx={buttonStyles.operator}>-</Button>
        </Box>

        {/* Row 4: 1, 2, 3, + */}
        <Box sx={{ display: 'flex', gap: 0.75, flex: '0 0 auto', justifyContent: 'center' }}>
          <Button onClick={() => inputNumber('1')} sx={buttonStyles.number}>1</Button>
          <Button onClick={() => inputNumber('2')} sx={buttonStyles.number}>2</Button>
          <Button onClick={() => inputNumber('3')} sx={buttonStyles.number}>3</Button>
          <Button onClick={() => performOperation('+')} sx={buttonStyles.operator}>+</Button>
        </Box>

        {/* Row 5: 0, ., +/-, = */}
        <Box sx={{ display: 'flex', gap: 0.75, flex: '0 0 auto', justifyContent: 'center' }}>
          <Button onClick={() => inputNumber('0')} sx={buttonStyles.number}>0</Button>
          <Button onClick={inputDecimal} sx={buttonStyles.number}>.</Button>
          <Button onClick={toggleSign} sx={{ ...buttonStyles.number, fontSize: `${Math.max(0.75, Math.min(1.1, buttonSize / 60))}rem` }}>+/-</Button>
          <Button onClick={performEquals} sx={buttonStyles.equals}>=</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SimpleCalculatorWidget;
