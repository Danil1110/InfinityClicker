import telebot
from telebot import types
import requests
from bs4 import BeautifulSoup

bot_token = '6036915716:AAEwZox37Eic8ikFH_ptGRQrd4gND7-B6Kw'

bot = telebot.TeleBot(bot_token)

# Обработчик команды /start
@bot.message_handler(commands=['start'])
def send_welcome(message):
    # Отправляем приветственное сообщение и кнопку
    reply_markup = types.InlineKeyboardMarkup()
    url_button = types.InlineKeyboardButton("Open App", web_app=types.WebAppInfo('https://danil1110.github.io/Infinity-Clicker/'))
    reply_markup.add(url_button)
    bot.reply_to(message, "⚡️ Welcome! Press the button to play!", reply_markup=reply_markup)

bot.polling()
