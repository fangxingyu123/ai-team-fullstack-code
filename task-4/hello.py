#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hello World 程序 - Hello, 你好

这是一个简单的问候程序，用于练习基本的 Python 编程技能。
功能：输出多语言问候语

作者：qianwen-worker
日期：2026-03-04
"""

def say_hello():
    """
    输出问候语函数
    
    Returns:
        bool: 成功返回 True，失败返回 False
    """
    try:
        # 输出英文问候
        print("Hello, World!")
        # 输出中文问候
        print("你好，世界！")
        # 输出组合问候（任务要求的格式）
        print("Hello, 你好")
        return True
    except Exception as e:
        # 错误处理：捕获任何异常并输出错误信息
        print(f"发生错误：{e}")
        return False

def main():
    """
    主函数 - 程序入口点
    """
    try:
        print("=" * 40)
        print("开始运行 Hello World 程序")
        print("=" * 40)
        
        # 调用问候函数
        success = say_hello()
        
        print("=" * 40)
        if success:
            print("程序执行成功！✓")
        else:
            print("程序执行失败！✗")
        print("=" * 40)
        
    except KeyboardInterrupt:
        # 处理用户中断（Ctrl+C）
        print("\n程序被用户中断")
    except Exception as e:
        # 捕获主函数中的任何异常
        print(f"主函数错误：{e}")

if __name__ == "__main__":
    # 只有直接运行此文件时才执行 main()
    main()
