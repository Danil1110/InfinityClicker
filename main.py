import telebot
from telebot import types
import requests
from bs4 import BeautifulSoup
import sqlite3
from flask import Flask, request, jsonify, render_template
import threading

bot_token = ''
DATABASE = 'users.db'

app = Flask(__name__)
bot = telebot.TeleBot(bot_token)

# Инициализация базы данных
def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            telegram_id INTEGER UNIQUE,
            username TEXT,
            first_name TEXT,
            address TEXT,
            score INTEGER DEFAULT 0,
            charge INTEGER DEFAULT 1000,
            click_upgrade_level INTEGER DEFAULT 1,
            click_upgrade_cost INTEGER DEFAULT 100,
            click_upgrade INTEGER DEFAULT 1,
            charge_speed_level INTEGER DEFAULT 1,
            charge_speed_cost INTEGER DEFAULT 750,
            charge_capacity_level INTEGER DEFAULT 1,
            charge_capacity_cost INTEGER DEFAULT 500,
            charge_speed INTEGER DEFAULT 2000,
            charge_capacity INTEGER DEFAULT 1000,
            charge_increment INTEGER DEFAULT 7
        )
    ''')
    conn.commit()
    conn.close()

# Добавление пользователя в базу данных
def add_user(telegram_id, username, first_name):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR IGNORE INTO users (telegram_id, username, first_name)
        VALUES (?, ?, ?)
    ''', (telegram_id, username, first_name))
    conn.commit()
    conn.close()

# Обновление адреса кошелька пользователя
def update_user_address(telegram_id, address):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users SET address = ? WHERE telegram_id = ?
    ''', (address, telegram_id))
    conn.commit()
    conn.close()

# Удаление адреса кошелька пользователя
def remove_user_address(telegram_id):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users SET address = NULL WHERE telegram_id = ?
    ''', (telegram_id,))
    conn.commit()
    conn.close()

# Получение данных кошелька пользователя
def get_wallet_data(telegram_id):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT score, charge, click_upgrade_level, click_upgrade_cost, click_upgrade,
               charge_speed_level, charge_speed_cost, charge_capacity_level,
               charge_capacity_cost, charge_speed, charge_capacity, charge_increment
        FROM users WHERE telegram_id = ?
    ''', (telegram_id,))
    data = cursor.fetchone()
    conn.close()
    if data:
        return {
            'status': 'success',
            'score': data[0],
            'charge': data[1],
            'click_upgrade_level': data[2],
            'click_upgrade_cost': data[3],
            'click_upgrade': data[4],
            'charge_speed_level': data[5],
            'charge_speed_cost': data[6],
            'charge_capacity_level': data[7],
            'charge_capacity_cost': data[8],
            'charge_speed': data[9],
            'charge_capacity': data[10],
            'charge_increment': data[11]
        }
    else:
        return {'status': 'error', 'message': 'User not found'}

# Обновление данных кошелька пользователя
def update_wallet_data(telegram_id, data):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users SET score = ?, charge = ?, click_upgrade_level = ?, click_upgrade_cost = ?,
                         click_upgrade = ?, charge_speed_level = ?, charge_speed_cost = ?,
                         charge_capacity_level = ?, charge_capacity_cost = ?, charge_speed = ?,
                         charge_capacity = ?, charge_increment = ?
        WHERE telegram_id = ?
    ''', (data['score'], data['charge'], data['click_upgrade_level'], data['click_upgrade_cost'],
          data['click_upgrade'], data['charge_speed_level'], data['charge_speed_cost'],
          data['charge_capacity_level'], data['charge_capacity_cost'], data['charge_speed'],
          data['charge_capacity'], data['charge_increment'], telegram_id))
    conn.commit()
    conn.close()

# Flask маршрут для рендеринга index.html
@app.route('/')
def index():
    return render_template('index.html')

# Flask маршрут для подключения кошелька
@app.route('/connect_wallet', methods=['POST'])
def connect_wallet():
    data = request.get_json()
    telegram_id = data.get('telegram_id')
    address = data.get('address')
    if telegram_id and address:
        update_user_address(telegram_id, address)
        return jsonify({'status': 'success', 'message': 'Wallet connected successfully'})
    return jsonify({'status': 'error', 'message': 'Invalid data'})

# Flask маршрут для отключения кошелька
@app.route('/disconnect_wallet', methods=['POST'])
def disconnect_wallet():
    data = request.get_json()
    telegram_id = data.get('telegram_id')
    if telegram_id:
        remove_user_address(telegram_id)
        return jsonify({'status': 'success', 'message': 'Wallet disconnected successfully'})
    return jsonify({'status': 'error', 'message': 'Invalid data'})

# Flask маршрут для получения данных кошелька
@app.route('/get_wallet_data', methods=['POST'])
def get_wallet():
    data = request.get_json()
    telegram_id = data.get('telegram_id')
    if telegram_id:
        wallet_data = get_wallet_data(telegram_id)
        return jsonify(wallet_data)
    return jsonify({'status': 'error', 'message': 'Invalid data'})

# Flask маршрут для обновления данных кошелька
@app.route('/update_wallet_data', methods=['POST'])
def update_wallet():
    data = request.get_json()
    telegram_id = data.get('telegram_id')
    if telegram_id:
        update_wallet_data(telegram_id, data)
        return jsonify({'status': 'success', 'message': 'Wallet data updated successfully'})
    return jsonify({'status': 'error', 'message': 'Invalid data'})

# Обработчик команды /start
@bot.message_handler(commands=['start'])
def start_command(message):
    telegram_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name

    add_user(telegram_id, username, first_name)

    # Приветственное сообщение
    reply_markup = types.InlineKeyboardMarkup()
    play_button = types.InlineKeyboardButton("Play", web_app=types.WebAppInfo("https://danil1110.github.io/InfinityClicker/"))
    reply_markup.add(play_button)
    bot.reply_to(message, "⚡️ Welcome! Press the button to play!", reply_markup=reply_markup)

# Функция для запуска Flask-сервера
def run_flask():
    app.run(host='0.0.0.0', port=5000)

# Функция для запуска Telegram-бота
def run_telegram_bot():
    bot.polling()

if __name__ == '__main__':
    init_db()
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()
    run_telegram_bot()
