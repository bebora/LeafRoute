#!/usr/bin/env python3
import decimal
import random
import sys

N = 0
decimal.getcontext().prec = 8


def percentageMatrix(matrix):
    m_sum = sumMatrix(matrix)
    return [[decimal.Decimal(value)/decimal.Decimal(m_sum) for value in row] for row in matrix]


def printCSV(matrix):
    print('\n'.join(','.join(str(j) for j in i) for i in matrix))


def randomMatrix(n):
    return [[random.randint(0, 24)**2 for j in range(n)] for i in range(n)]


def sumMatrix(matrix):
    return sum(sum(i) for i in matrix)


def main():
    # First argument is matrix order, default 9
    try:
        N = int(sys.argv[1])
    except Exception as e:
        N = 9
    printCSV(percentageMatrix(randomMatrix(N)))


if __name__ == "__main__":
    main()
