#!/usr/bin/env python3
"""
Hello World 脚本 - GitHub Issue #1 测试任务
功能：
1. 打印 Hello World
2. 打印当前时间
3. 简单的加法函数并调用它
"""

from datetime import datetime


def add(a, b):
    """简单的加法函数"""
    return a + b


def main():
    # 1. 打印 Hello World
    print("Hello World!")
    
    # 2. 打印当前时间
    current_time = datetime.now()
    print(f"当前时间：{current_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 3. 调用加法函数
    result = add(3, 5)
    print(f"3 + 5 = {result}")


if __name__ == "__main__":
    main()
