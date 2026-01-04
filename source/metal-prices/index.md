---
title: 📈 全球金属实时行情监控
date: 2026-01-04 12:00:00
type: "metal-prices"
layout: page
comments: false
---

{% raw %}
<div id="lock-screen" style="text-align: center; margin-top: 50px; padding: 40px; background: #f5f5f5; border-radius: 10px;">
    <h3>🔒 此页面已加密</h3>
    <p>请输入访问密码以查看实时报价：</p>
    <input type="password" id="password-input" placeholder="请输入密码" style="padding: 10px; border-radius: 5px; border: 1px solid #ddd; outline: none;">
    <button onclick="checkPassword()" style="padding: 10px 20px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">解锁</button>
    <p id="error-msg" style="color: red; display: none; margin-top: 10px;">密码错误，请重试。</p>
</div>

<div id="market-content" style="display: none;">
    <p style="text-align: center; color: #666; font-size: 0.9em;">数据来源：TradingView | 计价单位：美元(USD)</p>
    
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js" async>
      {
      "width": "100%",
      "height": 550,
      "symbolsGroups": [
        {
          "name": "贵金属 (Precious Metals)",
          "originalName": "Commodities",
          "symbols": [
            {
              "name": "OANDA:XAUUSD",
              "displayName": "黄金 (Gold)"
            },
            {
              "name": "OANDA:XAGUSD",
              "displayName": "白银 (Silver)"
            }
          ]
        },
        {
          "name": "工业与能源金属 (Industrial)",
          "symbols": [
            {
              "name": "COMEX:HG1!",
              "displayName": "铜期货 (Copper)"
            },
            {
              "name": "COMEX:UX1!",
              "displayName": "铀期货 (Uranium)"
            },
            {
              "name": "AMEX:LIT",
              "displayName": "锂电池ETF (Lithium)"
            }
          ]
        }
      ],
      "showSymbolLogo": true,
      "isTransparent": false,
      "colorTheme": "light",
      "locale": "zh_CN"
    }
      </script>
    </div>
    <hr>
    
    <div class="tradingview-widget-container" style="margin-top: 30px;">
      <div id="tradingview_chart"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
      <script type="text/javascript">
      function loadMainChart() {
          new TradingView.widget(
          {
          "width": "100%",
          "height": 500,
          "symbol": "OANDA:XAUUSD",
          "interval": "D",
          "timezone": "Asia/Shanghai",
          "theme": "light",
          "style": "1",
          "locale": "zh_CN",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": "tradingview_chart"
        }
          );
      }
      </script>
    </div>
</div>

<script>
    function checkPassword() {
        var input = document.getElementById('password-input').value;
        var lockScreen = document.getElementById('lock-screen');
        var content = document.getElementById('market-content');
        var errorMsg = document.getElementById('error-msg');

        if (input === '12357') {
            lockScreen.style.display = 'none';
            content.style.display = 'block';
            if(typeof loadMainChart === 'function') {
                loadMainChart();
            }
            localStorage.setItem('market_access', 'granted');
        } else {
            errorMsg.style.display = 'block';
            var inputField = document.getElementById('password-input');
            inputField.style.borderColor = "red";
            setTimeout(() => { inputField.style.borderColor = "#ddd"; }, 500);
        }
    }

    window.onload = function() {
        if (localStorage.getItem('market_access') === 'granted') {
            document.getElementById('password-input').value = '12357';
            checkPassword();
        }
    };
    
    document.getElementById("password-input").addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        checkPassword();
      }
    });
</script>

<style>
.tradingview-widget-container {
    border: 1px solid #eee;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    border-radius: 8px;
    overflow: hidden;
}
</style>
{% endraw %}