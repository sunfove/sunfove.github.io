/**
 * Modified from https://blog.skk.moe/post/hello-darkmode-my-old-friend/
 */
(function(window, document) {
  var rootElement = document.documentElement;
  var colorSchemaStorageKey = 'Fluid_Color_Scheme';
  var colorSchemaMediaQueryKey = '--color-mode';
  var userColorSchemaAttributeName = 'data-user-color-scheme';
  var defaultColorSchemaAttributeName = 'data-default-color-scheme';
  var colorToggleButtonSelector = '#color-toggle-btn';
  var colorToggleIconSelector = '#color-toggle-icon';
  var iframeSelector = 'iframe';
  function setLS(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  function removeLS(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }
  function getLS(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function getSchemaFromHTML() {
    var res = rootElement.getAttribute(defaultColorSchemaAttributeName);
    if (typeof res === 'string') {
      return res.replace(/["'\s]/g, '');
    }
    return null;
  }
  function getSchemaFromCSSMediaQuery() {
    var res = getComputedStyle(rootElement).getPropertyValue(
      colorSchemaMediaQueryKey
    );
    if (typeof res === 'string') {
      return res.replace(/["'\s]/g, '');
    }
    return null;
  }
  function resetSchemaAttributeAndLS() {
    rootElement.setAttribute(userColorSchemaAttributeName, getDefaultColorSchema());
    removeLS(colorSchemaStorageKey);
  }
  var validColorSchemaKeys = {
    dark : true,
    light: true
  };
  function getDefaultColorSchema() {
    var schema = getSchemaFromHTML();
    if (validColorSchemaKeys[schema]) {
      return schema;
    }
    schema = getSchemaFromCSSMediaQuery();
    if (validColorSchemaKeys[schema]) {
      return schema;
    }
    var hours = new Date().getHours();
    if (hours >= 18 || (hours >= 0 && hours <= 6)) {
      return 'dark';
    }
    return 'light';
  }
  function applyCustomColorSchemaSettings(schema) {
    var current = schema || getLS(colorSchemaStorageKey) || getDefaultColorSchema();
    if (current === getDefaultColorSchema()) {
      resetSchemaAttributeAndLS();
    } else if (validColorSchemaKeys[current]) {
      rootElement.setAttribute(
        userColorSchemaAttributeName,
        current
      );
    } else {
      resetSchemaAttributeAndLS();
      return;
    }
    setButtonIcon(current);
    setHighlightCSS(current);
    setApplications(current);
  }
  var invertColorSchemaObj = {
    dark : 'light',
    light: 'dark'
  };
  function getIconClass(scheme) {
    return 'icon-' + scheme;
  }
  function toggleCustomColorSchema() {
    var currentSetting = getLS(colorSchemaStorageKey);
    if (validColorSchemaKeys[currentSetting]) {
      currentSetting = invertColorSchemaObj[currentSetting];
    } else if (currentSetting === null) {
      var iconElement = document.querySelector(colorToggleIconSelector);
      if (iconElement) {
        currentSetting = iconElement.getAttribute('data');
      }
      if (!iconElement || !validColorSchemaKeys[currentSetting]) {
        currentSetting = invertColorSchemaObj[getSchemaFromCSSMediaQuery()];
      }
    } else {
      return;
    }
    setLS(colorSchemaStorageKey, currentSetting);
    return currentSetting;
  }
  function setButtonIcon(schema) {
    if (validColorSchemaKeys[schema]) {
      var icon = getIconClass('dark');
      if (schema) {
        icon = getIconClass(schema);
      }
      var iconElement = document.querySelector(colorToggleIconSelector);
      if (iconElement) {
        iconElement.setAttribute(
          'class',
          'iconfont ' + icon
        );
        iconElement.setAttribute(
          'data',
          invertColorSchemaObj[schema]
        );
      } else {
        Fluid.utils.waitElementLoaded(colorToggleIconSelector, function() {
          var iconElement = document.querySelector(colorToggleIconSelector);
          if (iconElement) {
            iconElement.setAttribute(
              'class',
              'iconfont ' + icon
            );
            iconElement.setAttribute(
              'data',
              invertColorSchemaObj[schema]
            );
          }
        });
      }
      if (document.documentElement.getAttribute('data-user-color-scheme')) {
        var color = getComputedStyle(document.documentElement).getPropertyValue('--navbar-bg-color').trim()
        document.querySelector('meta[name="theme-color"]').setAttribute('content', color)
      }
    }
  }
  function setHighlightCSS(schema) {
    var lightCss = document.getElementById('highlight-css');
    var darkCss = document.getElementById('highlight-css-dark');
    if (schema === 'dark') {
      if (darkCss) {
        darkCss.removeAttribute('disabled');
      }
      if (lightCss) {
        lightCss.setAttribute('disabled', '');
      }
    } else {
      if (lightCss) {
        lightCss.removeAttribute('disabled');
      }
      if (darkCss) {
        darkCss.setAttribute('disabled', '');
      }
    }
    setTimeout(function() {
      document.querySelectorAll('.markdown-body pre').forEach((pre) => {
        var cls = Fluid.utils.getBackgroundLightness(pre) >= 0 ? 'code-widget-light' : 'code-widget-dark';
        var widget = pre.querySelector('.code-widget-light, .code-widget-dark');
        if (widget) {
          widget.classList.remove('code-widget-light', 'code-widget-dark');
          widget.classList.add(cls);
        }
      });
    }, 200);
  }
  function setApplications(schema) {
    if (window.REMARK42) {
      window.REMARK42.changeTheme(schema);
    }
    if (window.CUSDIS) {
      window.CUSDIS.setTheme(schema);
    }
    var utterances = document.querySelector('.utterances-frame');
    if (utterances) {
      var utterancesTheme = schema === 'dark' ? window.UtterancesThemeDark : window.UtterancesThemeLight;
      const message = {
        type : 'set-theme',
        theme: utterancesTheme
      };
      utterances.contentWindow.postMessage(message, 'https://utteranc.es');
    }
    var giscus = document.querySelector('iframe.giscus-frame');
    if (giscus) {
      var giscusTheme = schema === 'dark' ? window.GiscusThemeDark : window.GiscusThemeLight;
      const message = {
        setConfig: {
          theme: giscusTheme,
        }
      };
      giscus.contentWindow.postMessage({ 'giscus': message }, 'https://giscus.app');
    }
  }
  applyCustomColorSchemaSettings();
  Fluid.utils.waitElementLoaded(colorToggleIconSelector, function() {
    applyCustomColorSchemaSettings();
    var button = document.querySelector(colorToggleButtonSelector);
    if (button) {
      button.addEventListener('click', function() {
        applyCustomColorSchemaSettings(toggleCustomColorSchema());
      });
      var icon = document.querySelector(colorToggleIconSelector);
      if (icon) {
        button.addEventListener('mouseenter', function() {
          var current = icon.getAttribute('data');
          icon.classList.replace(getIconClass(invertColorSchemaObj[current]), getIconClass(current));
        });
        button.addEventListener('mouseleave', function() {
          var current = icon.getAttribute('data');
          icon.classList.replace(getIconClass(current), getIconClass(invertColorSchemaObj[current]));
        });
      }
    }
  });
  Fluid.utils.waitElementLoaded(iframeSelector, function() {
    applyCustomColorSchemaSettings();
  });
})(window, document);