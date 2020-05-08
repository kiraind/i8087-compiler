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
x:float, a:int   # переменные-аргументы: float32/int16
y                # переменная-результат: float32
sqrt ( 2 * a * sin ( x ) ) # инфиксное выражение с пробелами вокруг операторов и операндов
```

Запускаем скрипт:

```
node index.js source.txt
```

Код модуля с функцией помещается в `module.asm`, в `stack.csv` помещается таблица состояний стека после каждой команды.