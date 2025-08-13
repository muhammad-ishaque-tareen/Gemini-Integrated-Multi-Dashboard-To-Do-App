import React, { useEffect, useState, useRef } from 'react';
import './Calculator.css';
import { evaluate, format } from 'mathjs';
console.log(evaluate('log10(100)'));

export default function Calculator({ showCalculator = true, setShowCalculator }) {
  const [mode, setMode] = useState('simple');
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [result, setResult] = useState('');
  const [memory, setMemory] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [angleMode, setAngleMode] = useState('deg');
  const [secondFunction, setSecondFunction] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'simple' ? 'scientific' : 'simple');
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key;
      if (/[0-9+\-*/.=()]/.test(key) || key === 'Enter' || key === 'Backspace' || key === 'Escape') {
        event.preventDefault();
      }
      const keyMap = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
        '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
        '+': '+', '-': '-', '*': '×', '/': '÷',
        '=': '=', 'Enter': '=',
        '.': '.',
        '(': '(', ')': ')',
        'Backspace': 'backspace',
        'Delete': 'AC',
        'Escape': 'AC'
      };
      
      if (keyMap[key]) {
        handleButtonClick(keyMap[key]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSecondFunction = () => {
    setSecondFunction(!secondFunction);
  };

  const buildExpression = (input) => {
    if (hasError) {
      return;
    }

    let newExpression = expression;
    const lastChar = newExpression.slice(-1);
    
    switch(input) {
      case 'AC':
        newExpression = '';
        setDisplay('0');
        setResult('');
        setHasError(false);
        break;
        
      case 'backspace':
        newExpression = expression.slice(0, -1);
        setDisplay(newExpression || '0');
        break;
        
      case '=':
        evaluateExpression();
        return;
        
      case '+/-':
        if (newExpression) {
          const lastNumberMatch = newExpression.match(/([\d.]+)$/);
          if (lastNumberMatch) {
            const lastNumber = lastNumberMatch[0];
            const beforeNumber = newExpression.slice(0, -lastNumber.length);
            if (beforeNumber.endsWith('-')) {
              newExpression = beforeNumber.slice(0, -1) + lastNumber;
            } 
            else {
              newExpression = beforeNumber + '-' + lastNumber;
            }
          }
          else {
            newExpression = newExpression + '-';
          }
        } 
        else {
          newExpression = '-';
        }
        break;
        
      case '%':
        if (newExpression) {
          const lastNumberMatch = newExpression.match(/([\d.]+)$/);
          if (lastNumberMatch) {
            newExpression = newExpression + '%';
          }
        }
        break;
        
      default:
        newExpression = handleInputType(input, newExpression);
        break;
    }
    
    setExpression(newExpression);
    setDisplay(newExpression || '0');
  };

  const handleInputType = (input, currentExpression) => {
    const lastChar = currentExpression.slice(-1);
    const lastTwoChars = currentExpression.slice(-2);

    if (/[0-9]/.test(input)) {
      return handleNumberInput(input, currentExpression, lastChar);
    }
    else if (input === '.') {
      return handleDecimalInput(currentExpression, lastChar);
    }
    else if (['+', '-', '×', '÷'].includes(input)) {
      return handleOperatorInput(input, currentExpression, lastChar);
    }
    else if (input === '(') {
      return handleOpenParenthesis(currentExpression, lastChar);
    }
    else if (input === ')') {
      return handleCloseParenthesis(currentExpression, lastChar);
    }
    else if (['sin', 'cos', 'tan', 'ln', 'log10', 'sinh', 'cosh', 'tanh'].includes(input)) {
      return handleFunctionInput(input, currentExpression, lastChar);
    }
    else if (['π', 'e'].includes(input)) {
      return handleConstantInput(input, currentExpression, lastChar);
    }
    else if (['x²', 'x³', 'xʸ', '²√x', '³√x', 'ʸ√x', '1/x', 'x!'].includes(input)) {
      return handlePowerFunctionInput(input, currentExpression, lastChar);
    }
    else if (['eˣ', '10ˣ', 'EE', 'Rand'].includes(input)) {
      return handleSpecialFunctionInput(input, currentExpression, lastChar);
    }
    else if (['mc', 'm+', 'm-', 'mr'].includes(input)) {
      handleMemoryFunction(input);
      return currentExpression;
    }
    else if (input === 'Deg') {
      setAngleMode(angleMode === 'deg' ? 'rad' : 'deg');
      return currentExpression;
    }
    else {
      return currentExpression + input;
    }
  };

  const handleNumberInput = (input, currentExpression, lastChar) => {
    if (input === '0' && currentExpression === '0') {
      return currentExpression;
    }
    
    if (currentExpression === '0' && input !== '0') {
      return input;
    }
    
    if (lastChar === ')' || ['π', 'e'].includes(lastChar)) {
      return currentExpression + '*' + input;
    }
    
    return currentExpression + input;
  };

  const handleDecimalInput = (currentExpression, lastChar) => {
    const numbers = currentExpression.split(/[+\-×÷()]/);
    const lastNumber = numbers[numbers.length - 1];
    
    if (lastNumber.includes('.')) {
      return currentExpression;
    }
    
    if (['+', '-', '×', '÷', '(', ''].includes(lastChar)) {
      return currentExpression + '0.';
    }
    
    return currentExpression + '.';
  };

  const handleOperatorInput = (input, currentExpression, lastChar) => {
    if (currentExpression === '' && input !== '-') {
      return currentExpression;
    }
    
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      return currentExpression.slice(0, -1) + input;
    }
    
    if (lastChar === '(' && input !== '-') {
      return currentExpression;
    }
    
    return currentExpression + input;
  };

  const handleOpenParenthesis = (currentExpression, lastChar) => {
    if (/[0-9)πe]/.test(lastChar)) {
      return currentExpression + '*' + '(';
    }
    
    return currentExpression + '(';
  };

  const handleCloseParenthesis = (currentExpression, lastChar) => {
    const openCount = (currentExpression.match(/\(/g) || []).length;
    const closeCount = (currentExpression.match(/\)/g) || []).length;
    
    if (openCount > closeCount && !['+', '-', '×', '÷', '('].includes(lastChar)) {
      return currentExpression + ')';
    }
    
    return currentExpression;
  };

  const handleFunctionInput = (input, currentExpression, lastChar) => {
    if (/[0-9)πe]/.test(lastChar)) {
      return currentExpression + '*' + input + '(';
    }
    
    return currentExpression + input + '(';
  };

  const handleConstantInput = (input, currentExpression, lastChar) => {
    if (/[0-9)]/.test(lastChar)) {
      return currentExpression + '*' + input;
    }
    
    return currentExpression + input;
  };

  const handlePowerFunctionInput = (input, currentExpression, lastChar) => {
    if (input === 'x²') {
      if (/[0-9)πe]/.test(lastChar)) {
        return currentExpression + '²';
      }
    } else if (input === 'x³') {
      if (/[0-9)πe]/.test(lastChar)) {
        return currentExpression + '³';
      }
    } else if (input === 'x!') {
      if (/[0-9)]/.test(lastChar)) {
        return currentExpression + '!';
      }
    } else if (input === '1/x') {
      return '1/(' + currentExpression + ')';
    } else if (input === '²√x') {
      return '²√(' + currentExpression + ')';
    } else if (input === '³√x') {
      return '³√(' + currentExpression + ')';
    }
    
    return currentExpression + input;
  };

  const handleSpecialFunctionInput = (input, currentExpression, lastChar) => {
    if (input === 'Rand') {
      if (/[0-9)πe]/.test(lastChar)) {
        return currentExpression + '*' + input;
      }
      return currentExpression + input;
    }
    
    return currentExpression + input;
  };

  const handleMemoryFunction = (input) => {
    switch(input) {
      case 'mc':
        setMemory(0);
        break;
      case 'm+':
        if (result && !hasError) {
          setMemory(memory + parseFloat(result));
        }
        break;
      case 'm-':
        if (result && !hasError) {
          setMemory(memory - parseFloat(result));
        }
        break;
      case 'mr':
        setExpression(memory.toString());
        setDisplay(memory.toString());
        break;
    }
  };

  const evaluateExpression = () => {
    if (!expression || expression.trim() === '') {
      return;
    }

    try {
      setHasError(false);
      
      let mathExpression = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/\be\b/g, 'e')
        .replace(/x²/g, '^2')
        .replace(/x³/g, '^3')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/²√x/g, 'sqrt(x)')
        .replace(/³√x/g, 'cbrt(x)')
        .replace(/²√\(/g, 'sqrt(')
        .replace(/³√\(/g, 'cbrt(')
        .replace(/³√\(/g, 'cbrt(')
        .replace(/xʸ/g, '^')
        .replace(/ʸ√\(/g, 'pow(')
        .replace(/ʸ√(\d+)/g, 'pow($1, 1/')
        .replace(/eˣ/g, 'exp')
        .replace(/10ˣ/g, '10^')
        .replace(/1\/x/g, '1/')
        .replace(/log10\(/g, 'log10(')
        .replace(/ln/g, 'log')
        .replace(/x!/g, '!')
        .replace(/(\d+(\.\d+)?)!/g, 'factorial($1)')
        .replace(/sin\(/g, angleMode === 'deg' ? 'sin(deg(' : 'sin(')
        .replace(/cos\(/g, angleMode === 'deg' ? 'cos(deg(' : 'cos(')
        .replace(/tan\(/g, angleMode === 'deg' ? 'tan(deg(' : 'tan(')
        .replace(/sinh/g, 'sinh')
        .replace(/cosh/g, 'cosh')
        .replace(/tanh/g, 'tanh')
        .replace(/(\d)(\()/g, '$1*$2')
        .replace(/(\))(\d)/g, '$1*$2')
        .replace(/(\))(\()/g, '$1*$2')
        .replace(/(\d)(π|e)/g, '$1*$2')
        .replace(/(π|e)(\d)/g, '$1*$2')
        .replace(/(\d+)%/g, '($1/100)');

      mathExpression = mathExpression.replace(/(\d+(?:\.\d+)?)EE(\d+)/g, '$1*10^$2');
      mathExpression = mathExpression.replace(/Rand/g, 'random()');
      
      if (angleMode === 'deg') {
        mathExpression = mathExpression.replace(/sin\(deg\(/g, 'sin(deg(');
        mathExpression = mathExpression.replace(/cos\(deg\(/g, 'cos(deg(');
        mathExpression = mathExpression.replace(/tan\(deg\(/g, 'tan(deg(');
        
        const openParens = (mathExpression.match(/deg\(/g) || []).length;
        for (let i = 0; i < openParens; i++) {
          mathExpression += ')';
        }
      }
      
      const openCount = (mathExpression.match(/\(/g) || []).length;
      const closeCount = (mathExpression.match(/\)/g) || []).length;
      const missingClose = openCount - closeCount;
      
      if (missingClose > 0) {
        mathExpression += ')'.repeat(missingClose);
      }

      let calculatedResult = evaluate(mathExpression);
      
      if (typeof calculatedResult === 'number') {
        if (!isFinite(calculatedResult)) {
          throw new Error('Mathematical Error');
        }
        
        if (Math.abs(calculatedResult) > 1e15 || (Math.abs(calculatedResult) < 1e-10 && calculatedResult !== 0)) {
          calculatedResult = calculatedResult.toExponential(8);
        } 
        else if (calculatedResult.toString().length > 12) {
          calculatedResult = calculatedResult.toPrecision(10);
        }
        else {
          calculatedResult = Math.round(calculatedResult * 1e10) / 1e10;
          
          if (calculatedResult % 1 === 0) {
            calculatedResult = calculatedResult.toString();
          } else {
            calculatedResult = calculatedResult.toString();
            if (calculatedResult.length > 12) {
              calculatedResult = parseFloat(calculatedResult).toPrecision(10);
            }
          }
        }
      }
      
      setResult(calculatedResult.toString());
      setExpression('');
      setDisplay(calculatedResult.toString());
      
    } catch (error) {
      setHasError(true);
      setResult('Error');
      setDisplay('Error');
      
      console.error('Calculation error:', error.message);
      console.error('Original expression:', expression);
      console.error('Converted expression:', mathExpression);
      
      setTimeout(() => {
        if (hasError) {
          setHasError(false);
          setExpression('');
          setDisplay('0');
          setResult('');
        }
      }, 2000);
    }
  };

   const DisplayExpression = ({ expression, result }) => {
    const displayRef = useRef(null);
    
    
    useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
    }, [expression]);

   return (
      <>
        <div className="expression-line" ref={displayRef}>
          {expression}
        </div>
        <div className="result-line">
          {result}
        </div>
      </>
    );
  };

  const handleBasicOperation = (operator) => {
    if (hasError) return;
    
    const operators = {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '×': (a, b) => a * b,
      '÷': (a, b) => {
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      }
    };
    
    const mathOp = operator.replace('×', '*').replace('÷', '/');
    buildExpression(mathOp);
  };

  const handleEquals = () => {
    if (expression && !hasError) {
      evaluateExpression();
    }
  };

  const handleTrigFunction = (func) => {
    if (hasError) return;
    
    try {
      buildExpression(`${func}(`);
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handleLogarithmFunction = (func) => {
    if (hasError) return;
    
    try {
      if (func === 'ln') {
        buildExpression('ln(');
      } else if (func === 'log10') {
        buildExpression('log10(');
      } else if (func === 'log') {
        buildExpression('log(');
      }
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handlePowerFunction = (func) => {
    if (hasError) return;
    
    try {
      switch(func) {
        case 'x²':
          if (expression && /[0-9)]$/.test(expression)) {
            buildExpression('²');
          } else {
            buildExpression('x²');
          }
          break;
          
        case 'x³':
          if (expression && /[0-9)]$/.test(expression)) {
            buildExpression('³');
          } else {
            buildExpression('x³');
          }
          break;
          
        case 'xʸ':
          buildExpression('^');
          break;
          
        case 'eˣ':
          buildExpression('eˣ(');
          break;
          
        case '10ˣ':
          buildExpression('10^(');
          break;
          
        default:
          buildExpression(func);
      }
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handleRootFunction = (func) => {
    if (hasError) return;
    
    try {
      switch(func) {
        case '²√x':
        case '√':
          buildExpression('sqrt('); 
          break;
          
        case '³√x':
          buildExpression('cbrt(');
          break;
          
        case 'ʸ√x':
          buildExpression('nthRoot(');
          break;
          
        default:
          buildExpression(func + '(');
      }
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handleSpecialFunction = (func) => {
    if (hasError) return;
    
    try {
      switch(func) {
        case '1/x':
          if (expression) {
            setExpression(`1/(${expression})`);
            setDisplay(`1/(${expression})`);
          } else {
            buildExpression('1/');
          }
          break;
          
        case 'x!':
          if (expression && /[0-9)]$/.test(expression)) {
            buildExpression('!');
          } else {
            buildExpression('x!');
          }
          break;
          
        case 'EE':
          buildExpression('EE');
          break;
          
        case 'Rand':
          const randomNum = Math.random();
          if (expression && /[0-9)]$/.test(expression)) {
            buildExpression(`*${randomNum}`);
          } else {
            buildExpression(randomNum.toString());
          }
          break;
          
        case 'e':
          buildExpression('e');
          break;
          
        case 'π':
          buildExpression('π');
          break;
          
        default:
          buildExpression(func);
      }
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handleHyperbolicFunction = (func) => {
    if (hasError) return;
    
    try {
      buildExpression(`${func}(`);
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handleAllClear = () => {
    setExpression('');
    setDisplay('0');
    setResult('');
    setHasError(false);
    console.log('Calculator cleared');
  };

  const handlePlusMinusToggle = () => {
    if (hasError) return;
    
    try {
      if (display && display !== '0' && display !== 'Error') {
        let currentValue = parseFloat(display);
        if (!isNaN(currentValue)) {
          currentValue = -currentValue;
          setDisplay(currentValue.toString());
          
          if (expression === display) {
            setExpression(currentValue.toString());
          }
        }
      }
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handlePercentage = () => {
    if (hasError) return;
    
    try {
      if (expression && expression !== display) {
        buildExpression('%');
      } 
      else if (display && display !== '0' && display !== 'Error') {
        const currentValue = parseFloat(display);
        if (!isNaN(currentValue)) {
          const percentValue = currentValue / 100;
          setDisplay(percentValue.toString());
          setExpression(percentValue.toString());
          setResult(percentValue.toString());
        }
      }
    } catch (error) {
      setHasError(true);
      setDisplay('Error');
    }
  };

  const handleBackspace = () => {
    if (hasError) {
      setHasError(false);
      setDisplay('0');
      setExpression('');
      return;
    }
    
    if (expression.length > 0) {
      const newExpression = expression.slice(0, -1);
      setExpression(newExpression);
      setDisplay(newExpression || '0');
    } else if (display !== '0') {
      setDisplay('0');
    }
  };

  const handleAngleMode = () => {
    const newMode = angleMode === 'deg' ? 'rad' : 'deg';
    setAngleMode(newMode);
    console.log(`Angle mode changed to: ${newMode.toUpperCase()}`);
  };

  const handleFunction = (functionName, value = null) => {
    if (['+', '-', '×', '÷'].includes(functionName)) {
      handleBasicOperation(functionName);
    }
    else if (functionName === '=') {
      handleEquals();
    }
    else if (['sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh'].includes(functionName)) {
      handleTrigFunction(functionName);
    }
    else if (['ln', 'log10', 'log'].includes(functionName)) {
      handleLogarithmFunction(functionName);
    }
    else if (['x²', 'x³', 'xʸ', 'eˣ', '10ˣ'].includes(functionName)) {
      handlePowerFunction(functionName);
    }
    else if (['²√x', '³√x', 'ʸ√x', '√'].includes(functionName)) {
      handleRootFunction(functionName);
    }
    else if (['1/x', 'x!', 'EE', 'Rand', 'e', 'π'].includes(functionName)) {
      handleSpecialFunction(functionName);
    }
    else if (['sinh', 'cosh', 'tanh'].includes(functionName)) {
      handleHyperbolicFunction(functionName);
    }
    else if (['mc', 'm+', 'm-', 'mr'].includes(functionName)) {
      handleMemoryFunction(functionName);
    }
    else if (functionName === 'AC') {
      handleAllClear();
    }
    else if (functionName === '+/-') {
      handlePlusMinusToggle();
    }
    else if (functionName === '%') {
      handlePercentage();
    }
    else if (functionName === 'backspace') {
      handleBackspace();
    }
    else if (functionName === 'Deg') {
      handleAngleMode();
    }
    else {
      buildExpression(functionName);
    }
  };

  const handleButtonClick = (buttonValue) => {
    handleFunction(buttonValue);
  };

  return (
  
    <div className={`calculator-container ${showCalculator ? 'visible' : ''}`}>
     <div className={`calculator ${mode}`}>
        <button 
          className="close-btn"
          onClick={() => setShowCalculator && setShowCalculator(false)}
        >
          &times;
        </button>
        <div className="display">
          <DisplayExpression expression={expression} result={display} />
        </div>

        {mode === 'scientific' && (
          <>
            <div className="button-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <button className="btn btn-dark" onClick={() => handleButtonClick('(')}>(</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick(')')}>)</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('mc')}>mc</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('m+')}>m+</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('m-')}>m-</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('mr')}>mr</button>
            </div>

            <div className="button-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <button 
                className={`btn ${secondFunction ? 'btn-orange' : 'btn-dark'}`} 
                onClick={handleSecondFunction}
              >
                2nd
              </button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('x²')}>x²</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('x³')}>x³</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('xʸ')}>xʸ</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('eˣ')}>eˣ</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('10ˣ')}>10ˣ</button>
            </div>

            <div className="button-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <button className="btn btn-dark" onClick={() => handleButtonClick('1/x')}>1/x</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('²√x')}>²√x</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('³√x')}>³√x</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('ʸ√x')}>ʸ√x</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('ln')}>ln</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('log10')}>log₁₀</button>
            </div>

            <div className="button-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <button className="btn btn-dark" onClick={() => handleButtonClick('x!')}>x!</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('sin')}>sin</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('cos')}>cos</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('tan')}>tan</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('e')}>e</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('EE')}>EE</button>
            </div>

            <div className="button-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <button className="btn btn-dark" onClick={() => handleButtonClick('Rand')}>Rand</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('sinh')}>sinh</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('cosh')}>cosh</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('tanh')}>tanh</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('π')}>π</button>
              <button className="btn btn-dark" onClick={() => handleButtonClick('Deg')}>
                {angleMode.toUpperCase()}
              </button>
            </div>
          </>
        )}

        <div className="button-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button className="btn btn-light" onClick={() => handleButtonClick('AC')}>AC</button>
          <button className="btn btn-light" onClick={() => handleButtonClick('+/-')}>+/-</button>
          <button className="btn btn-light" onClick={() => handleButtonClick('%')}>%</button>
          <button className="btn btn-orange" onClick={() => handleButtonClick('÷')}>÷</button>
        </div>

        <div className="button-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button className="btn btn-dark" onClick={() => handleButtonClick('7')}>7</button>
          <button className="btn btn-dark" onClick={() => handleButtonClick('8')}>8</button>
          <button className="btn btn-dark" onClick={() => handleButtonClick('9')}>9</button>
          <button className="btn btn-orange" onClick={() => handleButtonClick('×')}>×</button>
        </div>

        <div className="button-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button className="btn btn-dark" onClick={() => handleButtonClick('4')}>4</button>
          <button className="btn btn-dark" onClick={() => handleButtonClick('5')}>5</button>
          <button className="btn btn-dark" onClick={() => handleButtonClick('6')}>6</button>
          <button className="btn btn-orange" onClick={() => handleButtonClick('-')}>-</button>
        </div>

        <div className="button-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button className="btn btn-dark" onClick={() => handleButtonClick('1')}>1</button>
          <button className="btn btn-dark" onClick={() => handleButtonClick('2')}>2</button>
          <button className="btn btn-dark" onClick={() => handleButtonClick('3')}>3</button>
          <button className="btn btn-orange" onClick={() => handleButtonClick('+')}>+</button>
        </div>

        <div className="button-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button 
            className="btn btn-dark btn-mode" 
            onClick={toggleMode}
          >
            {mode === 'simple' ? '🔬' : '🧮'}
          </button>
          <button className="btn btn-dark btn-zero" onClick={() => handleButtonClick('0')}>0</button>
          <button className="btn btn-dark" onClick={() => handleButtonClick('.')}>.</button>
          <button className="btn btn-orange" onClick={() => handleButtonClick('=')}>=</button>
        </div>
      </div>
    </div>
    
  );
}