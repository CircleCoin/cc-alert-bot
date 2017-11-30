export const home = {
    "text": "Pick a color",
    "reply_markup": {
      "keyboard": [
        [
          {
            "text": "➕ New price alert",
            "callback_data": "New price alert"
          },
          {
            "text": "📓 My price alerts",
            "callback_data": "My price alerts"
          }
        ],
        [
          {
            "text": "⚙️ Settings",
            "callback_data": "Settings"
          },
          {
            "text": "ℹ️ Info",
            "callback_data": "Info"
          }
        ]
      ]
    }
};

export const settings = {
    "text": "🌐 Change your language",
    "reply_markup": {
        "keyboard": [
            [
                {
                    "text": "🌐  Change language",
                    "postback": "Change language"
                },
                {
                    "text": "⬅️ Back",
                    "postback": "Home"
                }
            ]
        ]
    }
};

export const changeLanguage = {
    "text": "🌐 Change language",
    "reply_markup": {
        "keyboard": [
            [
                {
                    "text": "🇺🇸 English",
                    "callback_data": "English"
                },
                {
                    "text": "🇪🇸 Español",
                    "callback_data": "Spanish"
                }
            ]
        ]
    }
};