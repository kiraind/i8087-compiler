# i8087-compiler

Компилятор инфиксных выражений в ассемблерный код для сопроцессора i8087.

## Использование

Клонируем репозиторий:

```sh
git clone https://github.com/kiraind/i8087-compiler
cd i8087-compiler
```

Редактируем файл `source.txt`:

```sh
code source.txt
```

Задаем в нем параметры по образцу:

```
x:float, a:int         # переменные-аргументы: float32/int16
y                      # переменная-результат: float32
sqrt ( 2*a * sin (x) ) # инфиксное выражение
```

Запускаем скрипт:

```sh
node index.js source.txt
```

Код модуля с функцией помещается в `module.asm`:
```asm
.model small, C ; модель сегментации памяти 'small'
.stack 100h  ; выделение памяти на стек
.486

.data ; начало описания сегмента данных
    ; внешние переменные
    Extrn C x:dword
    Extrn C a:word
    ; константы
    constant0 dd 40000000h ; 2
    
.code  ; начало описания сегмента кода

public C calc
calc proc
    ; вычисление выражения: sqrt(2*a*sin(x))
    ; с помощью постфиксного выражения: 2 a * x sin * sqrt

    finit
    fld constant0
    fild a
    fmulp
    fld x
    fsin
    fmulp
    fsqrt
    fst y

    ret
calc endp
end
```

В `stack.csv` помещается таблица состояний стека после каждой команды:

```csv
команда;        st0;                     st1;     st2; st3; st4; st5; st6; st7
finit
fld constant0;  2
fild a;         2;                       a
fmulp;          (2 * a)
fld x;          (2 * a);                 x
fsin;           (2 * a);                 sin(x)
fmulp;          ((2 * a) * sin(x))
fsqrt;          sqrt(((2 * a) * sin(x)))
fst y

```