var GoogleAuth;
var zE;








window.sectorSystem = {
  settings: {
    lineWidth: 0.15,
    lineColor: 16711680,
    lineAlpha: 0.3,
    backgroundColor: 0,
    backgroundAlpha: 0.2,
    sectorTextStyle: {
      fontFamily: "Arial",
      fontSize: 14,
      fill: 16777215
    },
    quarterTextStyle: {
      fontFamily: "Arial",
      fontSize: 20,
      fill: 16777215
    },
    showLines: true
  },
  state: {
    container: null,
    graphics: null,
    isActive: false,
    currentMode: null,
    texts: [],
    initialized: false,
    renderContainer: null,
    restored: false
  },
  findRenderContainer: function () {
    if (this.state.renderContainer) {
      return this.state.renderContainer;
    }
    if (window.laserGraphics?.parent) {
      this.state.renderContainer = window.laserGraphics.parent;
      return this.state.renderContainer;
    }
    if (window.ooo?.Mh?.Lh?.Wf) {
      this.state.renderContainer = window.ooo.Mh.Lh.Wf;
      return this.state.renderContainer;
    }
    const findWf = (obj, visited = new Set(), depth = 0) => {
      if (!obj || typeof obj !== "object" || depth > 3 || visited.has(obj)) {
        return null;
      }
      visited.add(obj);
      if (obj.Wf instanceof PIXI.Container) {
        this.state.renderContainer = obj.Wf;
        return obj.Wf;
      }
      for (let key in obj) {
        if (key !== "parent" && key !== "children" && obj[key] && typeof obj[key] === "object") {
          const result = findWf(obj[key], visited, depth + 1);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };
    return findWf(window.ooo);
  },
  cachedRadius: 0,
  lastRadiusTime: 0,
  getRadius: function () {
    const now = Date.now();
    if (now - this.lastRadiusTime > 1000) {
      this.cachedRadius = window.ooo?.Mh?.Qh?.gh || window.ooo?.Mh?.Lh?.Qh?.gh || 500;
      this.lastRadiusTime = now;
    }
    return this.cachedRadius;
  },
  clearTexts: function () {
    this.state.texts.forEach(text => {
      if (text && text.parent) {
        text.parent.removeChild(text);
      }
    });
    this.state.texts = [];
  },
  initDrawing: function (radius) {
    this.clearTexts();
    this.state.graphics.clear();
    this.state.graphics.lineStyle(this.settings.lineWidth, this.settings.lineColor, this.settings.lineAlpha);
    this.state.graphics.beginFill(this.settings.backgroundColor, this.settings.backgroundAlpha);
    this.state.graphics.drawCircle(0, 0, radius);
    this.state.graphics.endFill();
    return radius;
  },
  drawSectors: function () {
    const radius = this.initDrawing(this.getRadius());
    const innerRadius = radius / 3;
    if (this.settings.showLines) {
      for (let layer = 1; layer < 3; layer++) {
        this.state.graphics.drawCircle(0, 0, radius - layer * innerRadius);
      }
      for (let sector = 0; sector < 4; sector++) {
        const angle = sector * Math.PI / 2;
        this.state.graphics.moveTo(0, 0);
        this.state.graphics.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
    }
    for (let sector = 0; sector < 4; sector++) {
      const angle = sector * Math.PI / 2;
      for (let layer = 0; layer < 3; layer++) {
        const textRadius = radius - (layer * innerRadius + innerRadius / 2);
        const midAngle = angle + Math.PI / 4;
        const label = ["S", "D", "F"][layer] + (sector + 1);
        const text = new PIXI.Text(label, this.settings.sectorTextStyle);
        text.anchor.set(0.5);
        text.position.set(Math.cos(midAngle) * textRadius, Math.sin(midAngle) * textRadius);
        this.state.container.addChild(text);
        this.state.texts.push(text);
      }
    }
  },
  drawQuarters: function () {
    const radius = this.initDrawing(this.getRadius());
    if (this.settings.showLines) {
      this.state.graphics.moveTo(-radius, 0);
      this.state.graphics.lineTo(radius, 0);
      this.state.graphics.moveTo(0, -radius);
      this.state.graphics.lineTo(0, radius);
    }
    [{
      n: "UP 1",
      x: 1,
      y: -1
    }, {
      n: "UP 2",
      x: -1,
      y: -1
    }, {
      n: "UP 3",
      x: -1,
      y: 1
    }, {
      n: "UP 4",
      x: 1,
      y: 1
    }].forEach(q => {
      const text = new PIXI.Text(q.n, this.settings.quarterTextStyle);
      text.anchor.set(0.5);
      text.position.set(q.x * radius / 3, q.y * radius / 3);
      this.state.container.addChild(text);
      this.state.texts.push(text);
    });
  },
  initGraphics: function () {
    if (this.state.initialized) {
      return true;
    }
    const renderContainer = this.findRenderContainer();
    if (!renderContainer) {
      return false;
    }
    this.state.container = new PIXI.Container();
    this.state.graphics = new PIXI.Graphics();
    this.state.container.addChild(this.state.graphics);
    renderContainer.addChild(this.state.container);
    this.state.container.zIndex = 10;
    this.state.container.visible = false;
    this.state.initialized = true;
    return true;
  },
  toggleMode: function (mode) {
    if (!this.initGraphics()) {
      return;
    }
    if (this.state.isActive && this.state.currentMode === mode) {
      this.state.container.visible = false;
      this.state.isActive = false;
      this.state.currentMode = null;
      if (document.getElementById("sector_system_toggle")) {
        document.getElementById("sector_system_toggle").checked = false;
      }
      this.saveSettings();
      return;
    }
    this.state.isActive = true;
    this.state.currentMode = mode;
    this.state.container.visible = true;
    if (document.getElementById("sector_system_toggle")) {
      document.getElementById("sector_system_toggle").checked = true;
    }
    if (mode === "sectors") {
      this.drawSectors();
    } else {
      this.drawQuarters();
    }
    this.saveSettings();
  },
  setupKeyboardEvents: function () {
    const keyActions = {
      83: () => this.toggleMode("sectors"),
      187: () => this.toggleMode("sectors"),
      61: () => this.toggleMode("sectors"),
      88: () => this.toggleMode("quarters")
    };
    document.addEventListener("keydown", event => {
      const keyCode = event.keyCode || event.which;
      if (keyActions[keyCode]) {
        keyActions[keyCode]();
        if (typeof this.initUserInterface === "function") {
          this.initUserInterface();
        }
      }
    });
  },
  saveSettings: function () {
    try {
      localStorage.setItem("sectorSystemSettings", JSON.stringify(this.settings));
      localStorage.setItem("sectorSystemActive", this.state.isActive ? "1" : "0");
      if (this.state.currentMode) {
        localStorage.setItem("sectorSystemMode", this.state.currentMode);
      }
    } catch (e) {
      console.error("Error saving sector system settings:", e);
    }
  },
  loadSettings: function () {
    try {
      const savedSettings = JSON.parse(localStorage.getItem("sectorSystemSettings"));
      if (savedSettings) {
        this.settings = {
          ...this.settings,
          ...savedSettings
        };
      }
      const isActive = localStorage.getItem("sectorSystemActive") === "1";
      let currentMode = localStorage.getItem("sectorSystemMode");
      if (!currentMode) {
        currentMode = "sectors";
      }
      this.savedState = {
        isActive: isActive,
        currentMode: currentMode
      };
    } catch (e) {
      console.error("Error loading sector system settings:", e);
    }
  },
  applySettings: function () {
    if (this.state.isActive && this.state.currentMode) {
      if (this.state.currentMode === "sectors") {
        this.drawSectors();
      } else {
        this.drawQuarters();
      }
    }
  },
  init: function () {
    if (typeof PIXI === "undefined") {
      setTimeout(() => this.init(), 1000);
      return;
    }
    this.loadSettings();
    const graphicsInitialized = this.initGraphics();
    this.setupKeyboardEvents();
    if (!graphicsInitialized) {
      setTimeout(() => this.init(), 1000);
      return;
    }
    setTimeout(() => {
      if (this.savedState && this.savedState.isActive) {
        this.state.isActive = true;
        this.state.currentMode = this.savedState.currentMode;
        this.state.container.visible = true;
        if (this.state.currentMode === "sectors") {
          this.drawSectors();
        } else {
          this.drawQuarters();
        }
        if (document.getElementById("sector_system_toggle")) {
          document.getElementById("sector_system_toggle").checked = true;
        }
        this.state.restored = true;
        if ($("#sector_system_toggle").length > 0) {
          this.initUserInterface();
        }
      }
    }, 1000);
  },
  initUserInterface: function () {
    function colorToHex(color) {
      return "#" + color.toString(16).padStart(6, "0");
    }
    function hexToColor(hex) {
      return parseInt(hex.replace("#", ""), 16);
    }
    if (!this.state.restored && this.savedState && this.savedState.isActive) {
      console.log("Restoring state from UI initialization");
      this.toggleMode(this.savedState.currentMode || "sectors");
      this.state.restored = true;
    }
    const updateUI = () => {
      $("#sector_system_toggle").prop("checked", this.state.isActive);
      $("#sector_display_mode").val(this.state.currentMode || "sectors");
      $("#sector_bg_color").val(colorToHex(this.settings.backgroundColor));
      $("#sector_line_color").val(colorToHex(this.settings.lineColor));
      $("#sector_bg_opacity").val(this.settings.backgroundAlpha * 100);
      $("#sector_bg_opacity_value").text(Math.round(this.settings.backgroundAlpha * 100) + "%");
      $("#sector_line_opacity").val(this.settings.lineAlpha * 100);
      $("#sector_line_opacity_value").text(Math.round(this.settings.lineAlpha * 100) + "%");
      $("#sector_show_lines").prop("checked", this.settings.showLines);
      if (!this.settings.showLines) {
        $("#sector_lines_options").slideUp(200);
      } else {
        $("#sector_lines_options").slideDown(200);
      }
      if (this.state.isActive) {
        $("#sector_settings_panel").slideDown(300);
      } else {
        $("#sector_settings_panel").slideUp(200);
      }
    };
    $("#sector_system_toggle").off("change").on("change", function () {
      const isChecked = $(this).prop("checked");
      if (isChecked) {
        const mode = $("#sector_display_mode").val() || "sectors";
        window.sectorSystem.toggleMode(mode);
      } else if (window.sectorSystem.state.isActive) {
        window.sectorSystem.toggleMode(window.sectorSystem.state.currentMode);
      }
      updateUI();
    });
    $("#sector_display_mode").off("change").on("change", function () {
      const mode = $(this).val();
      if (window.sectorSystem.state.isActive) {
        window.sectorSystem.toggleMode(window.sectorSystem.state.currentMode);
        window.sectorSystem.toggleMode(mode);
        updateUI();
      }
    });
    $("#sector_bg_color").off("change").on("change", function () {
      window.sectorSystem.settings.backgroundColor = hexToColor($(this).val());
      window.sectorSystem.applySettings();
      window.sectorSystem.saveSettings();
    });
    $("#sector_line_color").off("change").on("change", function () {
      window.sectorSystem.settings.lineColor = hexToColor($(this).val());
      window.sectorSystem.applySettings();
      window.sectorSystem.saveSettings();
    });
    $("#sector_bg_opacity").off("input").on("input", function () {
      const value = parseInt($(this).val()) / 100;
      window.sectorSystem.settings.backgroundAlpha = value;
      $("#sector_bg_opacity_value").text(Math.round(value * 100) + "%");
      window.sectorSystem.applySettings();
      window.sectorSystem.saveSettings();
    });
    $("#sector_line_opacity").off("input").on("input", function () {
      const value = parseInt($(this).val()) / 100;
      window.sectorSystem.settings.lineAlpha = value;
      $("#sector_line_opacity_value").text(Math.round(value * 100) + "%");
      window.sectorSystem.applySettings();
      window.sectorSystem.saveSettings();
    });
    $("#sector_show_lines").off("change").on("change", function () {
      window.sectorSystem.settings.showLines = $(this).prop("checked");
      if (!window.sectorSystem.settings.showLines) {
        $("#sector_lines_options").slideUp(200);
      } else {
        $("#sector_lines_options").slideDown(200);
      }
      window.sectorSystem.applySettings();
      window.sectorSystem.saveSettings();
    });
    updateUI();
  }
};
function _typeof(app) {
  return (_typeof = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function (app) {
    return typeof app;
  } : function (app) {
    if (app && typeof Symbol == "function" && app.constructor === Symbol && app !== Symbol.prototype) {
      return "symbol";
    } else {
      return typeof app;
    }
  })(app);
}
(function () {
  var app = {};
  var config = {};
  var decoder = {};
  var utils = {};
  decoder.a = function (app) {
    var config = new String();
    var decoder = parseInt(app.substring(0, 2), 16);
    for (var utils = 2; utils < app.length; utils += 2) {
      var hexByte = parseInt(app.substring(utils, utils + 2), 16);
      config += String.fromCharCode(hexByte ^ (decoder = 3793 + decoder * 4513 & 255));
    }
    ;
    return config;
  };
  decoder.b = function (app) {
    return Function(`return ${app}; `)();
  };
  app.c = decoder.b("window");
  app.d = app.c.document;
  decoder.e = function () {
    return app.c.devicePixelRatio || 1;
  };
  app.c.addEventListener("load", function () {
    let hexByte = {
      eie: null,
      joystick: {
        positionMode: "L",
        checked: true,
        size: 90,
        mode: "dynamic",
        position: {
          left: "110px",
          bottom: "110px"
        },
        color: "red",
        pxy: 110
      },
      on: false,
      vj: null,
      uj: null,
      m: null,
      n: null
    };
    let gameSettings = {
      s_l: "https://timmapwormate.com",
      showSkinLines: false,
      fullscreen: null,
      headshot: 0,
      s_headshot: 0,
      mobile: false,
      mo: 1,
      mo1: {
        x: -1,
        y: -1
      },
      mo2: {
        x: -1,
        y: -1
      },
      s_kill: 0,
      kill: 0,
      died: 0,
      saveGame: false,
      pm: {},
      joystick: hexByte.joystick,
      j: null,
      pk: 0,
      pk0: "",
      pk1: "",
      pk2: "",
      pk3: "",
      pk4: "",
      pk5: "",
      pk6: "",
      z: 1,
      c_v: 222,
      c_1: "Cindynana GM",
      c_2: "Pham  Phu  Bach",
      c_3: "Tim map Wormate",
      c_4: "wormate.io",
      c_5: "please don't copy my code",
      d_1: "UTJsdVpIbE9ZVzVoSUVkTg==",
      d_2: "VUdoaGJTQlFhSFVnUW1GamFBPT0=",
      d_3: "VkdsdGJXRndWMjl5YldGMFpRPT0=",
      d_4: "VjI5eWJXRjBaUzVwYnc9PQ==",
      d_5: "VUd4bFlYTmxJR1J2YmlkMElHTnZjSGtnYlhrZ1kyOWtaUT09",
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: "",
      g: 36,
      s_w: false,
      s_n: "",
      v_z: 0,
      h: false,
      sn: true,
      s: false,
      hz: false,
      fz: true,
      tt: false,
      vh: false,
      vp: false,
      iq: false,
      ctrl: false,
      r1: true,
      sc: 0,
      wi: 0,
      to: 10,
      sm: 20,
      pi: "",
      pn: "",
      se: {
        a: [],
        b: [],
        c: [],
        d: [],
        e: [],
        f: [],
        g: [],
        h: [],
        i: [],
        j: [],
        k: []
      },
      st: false,
      hh: 0,
      sh: [],
      ws: [],
      we: [],
      wm: [],
      wg: [],
      wh: [],
      sg: [],
      gg: null,
      ig: -1,
      so: 1,
      re: false,
      dg: null
    };
    
    gameSettings.showSkinLines = false;
    
    let savedGame = localStorage.getItem("tmwSaveGame");
    if (savedGame && savedGame !== "null") {
      let savedData = JSON.parse(savedGame);
      for (let key in savedData) {
        gameSettings[key] = savedData[key];
      }
    };
    

    
    let detectMobileDevice = function () {
      let app = false;
      gameSettings.mobile = false;
      var config = navigator.userAgent || navigator.vendor || window.opera;
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(config) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(config.substr(0, 4))) {
        app = true;
        gameSettings.mobile = true;
      }
      return app;
    };
    let updateJoystickEnabled = function (app) {
      gameSettings.joystick ||= hexByte.joystick;
      gameSettings.joystick.checked = app.checked;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
    };
    let updateJoystickColor = function (app) {
      gameSettings.joystick ||= hexByte.joystick;
      gameSettings.joystick.color = app.value;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
    };
    let updateJoystickMode = function (app) {
      gameSettings.joystick ||= hexByte.joystick;
      gameSettings.joystick.mode = app.value;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
    };
    let updateJoystickPosition = function (app) {
      gameSettings.joystick ||= hexByte.joystick;
      gameSettings.joystick.position = {
        left: "75px",
        bottom: "75px"
      };
      if (app.value === "R") {
        gameSettings.joystick.position = {
          right: "75px",
          bottom: "75px"
        };
      }
      gameSettings.joystick.positionMode = app.value;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
    };
    let updateJoystickCoordinates = function (app) {
      gameSettings.joystick ||= hexByte.joystick;
      gameSettings.joystick.position = {
        left: (parseInt(app.value) + 10).toString() + "px",
        bottom: app.value + "px"
      };
      if (gameSettings.joystick.positionMode === "R") {
        gameSettings.joystick.position = {
          right: (parseInt(app.value) + 10).toString() + "px",
          bottom: app.value + "px"
        };
      }
      gameSettings.joystick.pxy = app.value;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
    };
    let updateJoystickSize = function (app) {
      gameSettings.joystick ||= hexByte.joystick;
      gameSettings.joystick.size = app.value;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
    };
    let processPlayerData = function (app, config, decoder, utils, hexByte, savedGame) {
      let savedData = {
        a: "",
        b: 0,
        c: ""
      };
      if (app > gameSettings.g * 100 + 100 || app < gameSettings.g * 10 || app === undefined) {
        gameSettings.a = app;
        if (app === undefined) {
          gameSettings.a = Math.floor(Math.random() * (gameSettings.g / 9) + (gameSettings.g - gameSettings.g / 9));
        }
        savedData.a = "00";
      } else {
        gameSettings.a = app - gameSettings.g * 10;
        savedData.b = gameSettings.a;
        gameSettings.a = gameSettings.a % (gameSettings.g / 9);
        savedData.b = (savedData.b - gameSettings.a) / (gameSettings.g / 9) + 1;
        gameSettings.a = gameSettings.a + (gameSettings.g - gameSettings.g / 9);
        savedData.a = savedData.b.toString(gameSettings.g).padStart(2, 0);
      }
      if (config > gameSettings.g * 20 || config < gameSettings.g / 9 * 100 || config === undefined) {
        if (config > gameSettings.g * 20 && config < gameSettings.g * 30) {
          gameSettings.b = config - gameSettings.g * 20;
          savedData.a = savedData.a + gameSettings.b.toString(gameSettings.g);
          gameSettings.b = 0;
          savedData.c = savedData.c + "1";
        } else {
          gameSettings.b = config;
          if (config === undefined) {
            gameSettings.b = 0;
          }
          savedData.a = savedData.a + "0";
          savedData.c = savedData.c + "0";
        }
      } else {
        gameSettings.b = config - gameSettings.g / 9 * 100 + gameSettings.g / gameSettings.g;
        savedData.a = savedData.a + gameSettings.b.toString(gameSettings.g);
        gameSettings.b = 0;
        savedData.c = savedData.c + "0";
      }
      if (decoder > gameSettings.g * 20 || decoder < gameSettings.g / 9 * 100 || decoder === undefined) {
        if (decoder > gameSettings.g * 20 && decoder < gameSettings.g * 30) {
          gameSettings.c = decoder - gameSettings.g * 20;
          savedData.a = savedData.a + gameSettings.c.toString(gameSettings.g);
          gameSettings.c = 0;
          savedData.c = savedData.c + "1";
        } else {
          gameSettings.c = decoder;
          if (decoder === undefined) {
            gameSettings.c = 0;
          }
          savedData.a = savedData.a + "0";
          savedData.c = savedData.c + "0";
        }
      } else {
        gameSettings.c = decoder - gameSettings.g / 9 * 100 + gameSettings.g / gameSettings.g;
        savedData.a = savedData.a + gameSettings.c.toString(gameSettings.g);
        gameSettings.c = 0;
        savedData.c = savedData.c + "0";
      }
      if (utils > gameSettings.g * 20 || utils < gameSettings.g / 9 * 100 || utils === undefined) {
        if (utils > gameSettings.g * 20 && utils < gameSettings.g * 30) {
          gameSettings.d = utils - gameSettings.g * 20;
          if (gameSettings.d.toString(gameSettings.g) === "N") {
            savedData.a = savedData.a + "0";
          } else {
            savedData.a = savedData.a + gameSettings.d.toString(gameSettings.g);
          }
          gameSettings.d = 0;
          savedData.c = savedData.c + "1";
        } else {
          gameSettings.d = utils;
          if (utils === undefined) {
            gameSettings.d = 0;
          }
          savedData.a = savedData.a + "0";
          savedData.c = savedData.c + "0";
        }
      } else {
        gameSettings.d = utils - gameSettings.g / 9 * 100 + gameSettings.g / gameSettings.g;
        if (gameSettings.d.toString(gameSettings.g) === "N") {
          savedData.a = savedData.a + "0";
        } else {
          savedData.a = savedData.a + gameSettings.d.toString(gameSettings.g);
        }
        gameSettings.d = 0;
        savedData.c = savedData.c + "0";
      }
      if (hexByte > gameSettings.g * 20 || hexByte < gameSettings.g / 9 * 100 || hexByte === undefined) {
        if (hexByte > gameSettings.g * 20 && hexByte < gameSettings.g * 30) {
          savedData.b = gameSettings.g / gameSettings.g;
          if (hexByte <= gameSettings.g * 20 + (gameSettings.g - 1)) {
            gameSettings.e = hexByte - gameSettings.g * 20;
          } else if (hexByte <= gameSettings.g * 20 + (gameSettings.g - 1) * 2) {
            savedData.b = savedData.b * 2;
            gameSettings.e = hexByte - gameSettings.g * 20 - (gameSettings.g - 1);
          } else if (hexByte <= gameSettings.g * 20 + (gameSettings.g - 1) * 3) {
            gameSettings.e = hexByte - gameSettings.g * 20 - (gameSettings.g - 1) * 2;
          } else if (hexByte <= gameSettings.g * 20 + (gameSettings.g - 1) * 4) {
            savedData.b = savedData.b * 2;
            gameSettings.e = hexByte - gameSettings.g * 20 - (gameSettings.g - 1) * 3;
          } else {
            gameSettings.e = 0;
          }
          if (gameSettings.e >= gameSettings.g) {
            savedData.b = 2;
            gameSettings.e = gameSettings.e - (gameSettings.g - 1);
          }
          savedData.a = savedData.a + gameSettings.e.toString(gameSettings.g);
          gameSettings.e = 0;
          savedData.c = savedData.c + "1";
        } else {
          gameSettings.e = hexByte;
          if (hexByte === undefined) {
            gameSettings.e = 0;
          }
          savedData.a = savedData.a + "0";
          savedData.c = savedData.c + "0";
          savedData.b = 0;
        }
      } else {
        savedData.b = gameSettings.g / gameSettings.g;
        if (hexByte - gameSettings.g / 9 * 100 + 1 >= gameSettings.g) {
          gameSettings.e = hexByte - (gameSettings.g / 9 * 100 + (gameSettings.g - 1));
          savedData.b = savedData.b * 2;
        } else {
          gameSettings.e = hexByte - gameSettings.g / 9 * 100 + savedData.b;
        }
        savedData.a = savedData.a + gameSettings.e.toString(gameSettings.g);
        gameSettings.e = 0;
        savedData.c = savedData.c + "0";
      }
      if (savedData.a == "000000") {
        gameSettings.f = savedGame.substr(0, 22).padEnd(22);
      } else {
        let key = parseInt(savedData.c, 2);
        if (hexByte > 790 && hexByte <= 860) {
          key += 16;
        }
        if (savedData.b <= 1) {
          savedData.a = savedData.a.substr(0, 5) + "|" + savedData.a.substr(5, 1);
        } else {
          savedData.a = savedData.a.substr(0, 4) + "|" + savedData.a.substr(4, 2);
        }
        if (savedGame == "") {
          savedGame = ".                       .";
        }
        if (savedData.c == "0000") {
          if (savedGame.substr(23, 1) == ".") {
            savedGame = savedGame.substr(0, 23).padEnd(23) + " " + savedGame.substr(24, 1).padEnd(1);
          }
          gameSettings.f = (savedGame.length >= 32 ? savedGame.substr(0, 25) : savedGame.substr(0, 25).padEnd(25)) + savedData.a;
        } else {
          gameSettings.f = (savedGame.length >= 32 ? savedGame.substr(0, 23) : savedGame.substr(0, 23).padEnd(23)) + "." + key.toString(gameSettings.g) + savedData.a;
        }
        gameSettings.f = gameSettings.f.replaceAll(" ", "_");
      }
    };
    let createJoystick = function (app) {
      let config;
      try {
        gameSettings.joystick ||= hexByte.joystick;
        if (detectMobileDevice() && app && gameSettings.joystick.checked) {
          (config = nipplejs.create(gameSettings.joystick)).on("move", function (app, config) {
            hexByte.eie.fo = config.angle.radian <= Math.PI ? config.angle.radian * -1 : Math.PI - (config.angle.radian - Math.PI);
          });
        }
        return config;
      } catch (decoder) {
        console.error(decoder);
      }
    };
    let parsePlayerData = function (app) {
      let config = {
        a: 0,
        b: 0,
        c: 0,
        d: 0,
        e: 0,
        f: "",
        g: 0,
        h: "",
        i: ""
      };
      let decoder = 0;
      config.h = app.substr(-9);
      if (config.h.substr(0, 1) != ".") {
        config.i = "0000";
      } else if ((decoder = parseInt(config.h.substr(1, 1), gameSettings.g)) > 15) {
        decoder -= 16;
        config.i = decoder.toString(2).padStart(4, 0);
      } else {
        config.i = decoder.toString(2).padStart(4, 0);
        decoder = 0;
      }
      config.f = app.substr(-7);
      if (config.f.substr(0, 2) != "00") {
        config.a = parseInt(config.f.substr(0, 2), gameSettings.g);
        config.a = (config.a - 1) * (gameSettings.g / 9) + gameSettings.g * 10 - (gameSettings.g - 4);
      }
      if (config.f.substr(5, 1) == "|") {
        if (config.f.substr(6, 1) != "0") {
          config.e = parseInt(config.f.substr(6, 1), gameSettings.g);
          if (config.i.substr(3, 1) != "0") {
            if (decoder > 0) {
              config.e = config.e + gameSettings.g * 20 + (gameSettings.g - 1) * 2;
            } else {
              config.e = config.e + gameSettings.g * 20;
            }
          } else {
            config.e = config.e - 1 + gameSettings.g / 9 * 100;
          }
        }
      } else {
        config.e = parseInt(config.f.substr(6, 1), gameSettings.g);
        if (config.i.substr(3, 1) != "0") {
          if (decoder > 0) {
            config.e = config.e + gameSettings.g * 20 + (gameSettings.g - 1) * 3;
          } else {
            config.e = config.e + gameSettings.g * 20 + (gameSettings.g - 1);
          }
        } else {
          config.e = config.e + (gameSettings.g / 9 * 100 + (gameSettings.g - 1));
        }
      }
      config.f = config.f.replace("|", "");
      if (config.f.substr(2, 1) != "0") {
        config.b = parseInt(config.f.substr(2, 1), gameSettings.g);
        if (config.i.substr(0, 1) != "0") {
          config.b = config.b + gameSettings.g * 20;
        } else {
          config.b = config.b - 1 + gameSettings.g / 9 * 100;
        }
      }
      if (config.f.substr(3, 1) != "0") {
        config.c = parseInt(config.f.substr(3, 1), gameSettings.g);
        if (config.i.substr(1, 1) != "0") {
          config.c = config.c + gameSettings.g * 20;
        } else {
          config.c = config.c - 1 + gameSettings.g / 9 * 100;
        }
      }
      if (config.f.substr(4, 1) != "0") {
        config.d = parseInt(config.f.substr(4, 1), gameSettings.g);
        if (config.i.substr(2, 1) != "0") {
          config.d = config.d + gameSettings.g * 20;
        } else {
          config.d = config.d - 1 + gameSettings.g / 9 * 100;
        }
      }
      return config;
    };
    let validateParameter = function (app) {
      return !(app > gameSettings.g * 30) && !(app < gameSettings.g / 9 * 100) || app == 0;
    };
    let validatePlayerNameFormat = function (app) {
      return /^(.{25})(\w{5}\|\w{1})$/.test(app) || /^(.{25})(\w{4}\|\w{2})$/.test(app);
    };
    let extractRealName = function (app) {
      app = app.replaceAll("_", " ");
      if (/^(.{25})(\w{7})$/.test(app)) {
        for (app = app.substr(0, 15).trim(); app.substr(app.length - 1, 1) == ".";) {
          app = app.substr(0, app.length - 1);
        }
        return app;
      }
      if (/^(.{25})(\w{5}\|\w{1})$/.test(app) || /^(.{25})(\w{4}\|\w{2})$/.test(app)) {
        if (app.substr(-9).substr(0, 1) != ".") {
          return app.substr(0, 25).trim();
        } else {
          return app.substr(0, 23).trim();
        }
      } else {
        return app;
      }
    };
    gameSettings.loading = true;
    var savedOco = localStorage.getItem("oco");
    localStorage.setItem("ccg_0", "Kill and Headshot stats will be removed?");
    localStorage.setItem("ccg_1", "There was a problem connecting!");
    localStorage.setItem("ccg_2", "Your account has been locked.");
    var savedSw = localStorage.getItem("tmwsw");
    var savedImages = localStorage.getItem("tmwi") != null ? localStorage.getItem("tmwi").split(",") : localStorage.getItem("tmwi");
    var savedImageVersion = localStorage.getItem("tmwit");
    var customWear = localStorage.getItem("custom_wear");
    var customSkin = localStorage.getItem("custom_skin");
    $("<input type=\"hidden\" id=\"port_id\" value=\"\">").insertAfter(".description-text");
    $("<input type=\"hidden\" id=\"port_id_s\" value=\"\">").insertAfter(".description-text");
    $("<input type=\"hidden\" id=\"port_name\" value=\"\">").insertAfter(".description-text");
    $("<input type=\"hidden\" id=\"port_name_s\" value=\"\">").insertAfter(".description-text");
    $("#mm-action-buttons").hover(function () {
      $("#port_id").val("");
      $("#port_name").val("");
    });
    var mapSprite = null;
    var _0x4d0ax21 = null;
    var _0x4d0ax22 = false;
    var _0x4d0ax23 = 55;
    var _0x4d0ax24 = 1;
    var _0x4d0ax25 = true;
    if (savedImages && savedImageVersion && savedImageVersion == gameSettings.v_z) {
      ;
    } else {
      fetch(gameSettings.s_l + "/store", {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          img: "i2"
        })
      }).then(async function (app) {
        savedImages = (app = await app.json()).i.split(".");
        localStorage.setItem("tmwi", savedImages);
        localStorage.setItem("tmwit", app.vs);
        gameSettings.v_z = app.vs;
        localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
        window.location.reload();
      }).catch(function (app) {});
    }
    ;
    var _0x4d0ax27 = PIXI.Texture.from(atob(savedImages[0]));
    var _0x4d0ax28 = PIXI.Texture.from(atob(savedImages[1]));
    var _0x4d0ax29 = PIXI.Texture.from(atob(savedImages[2]));
    var _0x4d0ax2a = PIXI.Texture.from(atob(savedImages[3]));
    var _0x4d0ax2b = PIXI.Texture.from(atob(savedImages[4]));
    var _0x4d0ax2c = PIXI.Texture.from(atob(savedImages[5]));
    var _0x4d0ax2d = PIXI.Texture.from(atob(savedImages[6]));
    var _0x4d0ax2e = PIXI.Texture.from(atob(savedImages[7]));
    var _0x4d0ax2f = new PIXI.Sprite(_0x4d0ax27);
    _0x4d0ax2f.buttonMode = true;
    _0x4d0ax2f.anchor.set(0.5);
    _0x4d0ax2f.x = -65;
    _0x4d0ax2f.y = 25;
    _0x4d0ax2f.interactive = true;
    _0x4d0ax2f.buttonMode = true;
    var _0x4d0ax30 = new PIXI.Sprite(_0x4d0ax29);
    _0x4d0ax30.buttonMode = true;
    _0x4d0ax30.anchor.set(0.5);
    _0x4d0ax30.x = -33;
    _0x4d0ax30.y = 25;
    _0x4d0ax30.interactive = true;
    _0x4d0ax30.buttonMode = true;
    var _0x4d0ax31 = new PIXI.Sprite(_0x4d0ax2b);
    _0x4d0ax31.buttonMode = true;
    _0x4d0ax31.anchor.set(0.5);
    _0x4d0ax31.x = -1;
    _0x4d0ax31.y = 25;
    _0x4d0ax31.interactive = true;
    _0x4d0ax31.buttonMode = true;
    var _0x4d0ax32 = new PIXI.Sprite(_0x4d0ax2e);
    _0x4d0ax32.buttonMode = true;
    _0x4d0ax32.anchor.set(0.5);
    _0x4d0ax32.x = -1;
    _0x4d0ax32.y = 25;
    _0x4d0ax32.interactive = true;
    _0x4d0ax32.buttonMode = true;
    var _0x4d0ax33 = new PIXI.Sprite(_0x4d0ax2d);
    _0x4d0ax33.buttonMode = true;
    _0x4d0ax33.anchor.set(0.5);
    _0x4d0ax33.x = -33;
    _0x4d0ax33.y = 25;
    _0x4d0ax33.interactive = true;
    _0x4d0ax33.buttonMode = true;
    _0x4d0ax30.alpha = 0.25;
    _0x4d0ax2f.alpha = 0.25;
    _0x4d0ax31.alpha = 0.25;
    _0x4d0ax33.alpha = 0.25;
    _0x4d0ax32.alpha = 0.25;
    var mapText = new PIXI.Text("Map: ?", {
      fontFamily: "PTSans",
      fill: "#fff009",
      fontSize: 12
    });
    mapText.anchor.x = 0.5;
    mapText.position.x = 110;
    var gameContainer = document.getElementById("game-cont");
    var gameView = document.getElementById("game-view");
    var gameModeParams = $("#mm-params-game-mode");
    app.d.getElementById("game-wrap").style.display = "block";
    (function (app, config, utils) {
      function hexByte(app, config) {
        return _typeof(app) === config;
      }
      function gameSettings() {
        if (_typeof(config.createElement) != "function") {
          return config.createElement(arguments[0]);
        } else if (updateJoystickPosition) {
          return config.createElementNS.call(config, "http://www.w3.org/2000/svg", arguments[0]);
        } else {
          return config.createElement.apply(config, arguments);
        }
      }
      var savedGame = [];
      var savedData = [];
      var key = {
        _version: "3.3.1",
        _config: {
          classPrefix: "",
          enableClasses: true,
          enableJSClass: true,
          usePrefixes: true
        },
        _q: [],
        on: function (app, config) {
          var decoder = this;
          setTimeout(function () {
            config(decoder[app]);
          }, 0);
        },
        addTest: function (app, config, decoder) {
          savedData.push({
            name: app,
            fn: config,
            options: decoder
          });
        },
        addAsyncTest: function (app) {
          savedData.push({
            name: null,
            fn: app
          });
        }
      };
      function detectMobileDevice() {}
      detectMobileDevice.prototype = key;
      detectMobileDevice = new detectMobileDevice();
      var updateJoystickEnabled = false;
      try {
        updateJoystickEnabled = "WebSocket" in app && app.WebSocket.CLOSING === 2;
      } catch (updateJoystickColor) {}
      ;
      detectMobileDevice.addTest("websockets", updateJoystickEnabled);
      var updateJoystickMode = config.documentElement;
      var updateJoystickPosition = updateJoystickMode.nodeName.toLowerCase() === "svg";
      detectMobileDevice.addTest("canvas", function () {
        var app = gameSettings("canvas");
        return !!app.getContext && !!app.getContext("2d");
      });
      detectMobileDevice.addTest("canvastext", function () {
        return detectMobileDevice.canvas !== false && _typeof(gameSettings("canvas").getContext("2d").fillText) == "function";
      });
      (function () {
        var app;
        var config;
        var utils;
        var gameSettings;
        var key;
        var updateJoystickEnabled;
        var updateJoystickColor;
        for (var updateJoystickMode in savedData) {
          if (savedData.hasOwnProperty(updateJoystickMode)) {
            app = [];
            if ((config = savedData[updateJoystickMode]).name && (app.push(config.name.toLowerCase()), config.options && config.options.aliases && config.options.aliases.length)) {
              for (utils = 0; utils < config.options.aliases.length; utils++) {
                app.push(config.options.aliases[utils].toLowerCase());
              }
            }
            ;
            gameSettings = hexByte(config.fn, "function") ? config.fn() : config.fn;
            key = 0;
            for (; key < app.length; key++) {
              if ((updateJoystickColor = (updateJoystickEnabled = app[key]).split(".")).length === 1) {
                detectMobileDevice[updateJoystickColor[0]] = gameSettings;
              } else {
                if (!!detectMobileDevice[updateJoystickColor[0]] && !(detectMobileDevice[updateJoystickColor[0]] instanceof Boolean)) {
                  detectMobileDevice[updateJoystickColor[0]] = new Boolean(detectMobileDevice[updateJoystickColor[0]]);
                }
                detectMobileDevice[updateJoystickColor[0]][updateJoystickColor[1]] = gameSettings;
              }
              savedGame.push((gameSettings ? "" : "no-") + updateJoystickColor.join("-"));
            }
          }
        }
      })();
      (function (app) {
        var config = updateJoystickMode.className;
        var utils = detectMobileDevice._config.classPrefix || "";
        if (updateJoystickPosition) {
          config = config.baseVal;
        }
        if (detectMobileDevice._config.enableJSClass) {
          var hexByte = RegExp("(^|\\s)" + utils + "no-js(\\s|$)");
          config = config.replace(hexByte, "$1" + utils + "js$2");
        }
        ;
        if (detectMobileDevice._config.enableClasses) {
          config += " " + utils + app.join(" " + utils);
          if (updateJoystickPosition) {
            updateJoystickMode.className.baseVal = config;
          } else {
            updateJoystickMode.className = config;
          }
        }
      })(savedGame);
      delete key.addTest;
      delete key.addAsyncTest;
      for (var updateJoystickCoordinates = 0; updateJoystickCoordinates < detectMobileDevice._q.length; updateJoystickCoordinates++) {
        detectMobileDevice._q[updateJoystickCoordinates]();
      }
      ;
      app.Modernizr = detectMobileDevice;
    })(window, document);
    if (!Modernizr.websockets || !Modernizr.canvas || !Modernizr.canvastext) {
      app.d.getElementById("error-view").style.display = "block";
      return;
    }
    ;
    utils.f = {
      g: function (app, config, utils) {
        app.stop();
        app.fadeIn(config, utils);
      },
      h: function (app, config, utils) {
        app.stop();
        app.fadeOut(config, utils);
      }
    };
    utils.i = decoder.b("WebSocket");
    utils.j = decoder.b("Float32Array");
    pixiBlendModes = (pixiLib = decoder.b("PIXI")).BLEND_MODES;
    pixiWrapModes = pixiLib.WRAP_MODES;
    utils.k = {
      l: pixiLib.Container,
      m: pixiLib.BaseTexture,
      n: pixiLib.Texture,
      o: pixiLib.Renderer,
      p: pixiLib.Graphics,
      q: pixiLib.Shader,
      r: pixiLib.Rectangle,
      s: pixiLib.Sprite,
      t: pixiLib.Text,
      u: pixiLib.Geometry,
      v: pixiLib.Mesh,
      w: {
        z: pixiBlendModes.ADD,
        A: pixiBlendModes.SCREEN,
        B: pixiBlendModes.MULTIPLY
      },
      C: {
        D: pixiWrapModes.REPEAT
      },
      F: {
        G: function (app) {
          var config = app.parent;
          if (config != null) {
            config.removeChild(app);
          }
        }
      }
    };
    config.H = {
      I: app.c.runtimeHash,
      J: "https://gateway.wormate.io",
      K: "https://resources.wormate.io",
      L: "/images/linelogo-valday2024.png",
      M: "/images/guest-avatar-valday2024.png",
      N: "/images/confetti-valday2024.png",
      O: "/images/bg-event-pattern-valday2025.png"
    };
    config.H.P = ((browserLang = app.c.I18N_LANG) || (browserLang = "en"), browserLang);
    config.H.Q = function () {
      var app;
      switch (config.H.P) {
        case "uk":
          app = "uk_UA";
          break;
        case "de":
          app = "de_DE";
          break;
        case "fr":
          app = "fr_FR";
          break;
        case "es":
          app = "es_ES";
          break;
        default:
          app = "en_US";
      }
      ;
      return app;
    }();
    moment.locale(config.H.Q);
    ooo = null;
    config.S = 6.283185307179586;
    config.T = 3.141592653589793;
    i18nMessages = app.c.I18N_MESSAGES;
    decoder.U = function (app) {
      return i18nMessages[app];
    };
    decoder.V = function (app) {
      if (app[config.H.P]) {
        return app[config.H.P];
      } else if (app.en) {
        return app.en;
      } else {
        return app.x;
      }
    };
    decoder.W = function (app) {
      return encodeURI(app);
    };
    decoder.X = function (app, config) {
      return setInterval(app, config);
    };
    decoder.Y = function (app, config) {
      return setTimeout(app, config);
    };
    decoder.Z = function (app) {
      clearTimeout(app);
    };
    decoder.$ = function (app) {
      var config = (decoder._(app) % 60).toString();
      var utils = (decoder._(app / 60) % 60).toString();
      var hexByte = (decoder._(app / 3600) % 24).toString();
      var gameSettings = decoder._(app / 86400).toString();
      var savedGame = decoder.U("util.time.days");
      var savedData = decoder.U("util.time.hours");
      var key = decoder.U("util.time.min");
      var detectMobileDevice = decoder.U("util.time.sec");
      if (gameSettings > 0) {
        return gameSettings + " " + savedGame + " " + hexByte + " " + savedData + " " + utils + " " + key + " " + config + " " + detectMobileDevice;
      } else if (hexByte > 0) {
        return hexByte + " " + savedData + " " + utils + " " + key + " " + config + " " + detectMobileDevice;
      } else if (utils > 0) {
        return utils + " " + key + " " + config + " " + detectMobileDevice;
      } else {
        return config + " " + detectMobileDevice;
      }
    };
    decoder.aa = function (app) {
      if (app.includes("href")) {
        return app.replaceAll("href", "target=\"_black\" href");
      } else {
        return app;
      }
    };
    decoder.ba = function (config, utils, hexByte) {
      var gameSettings = app.d.createElement("script");
      var savedGame = true;
      if (_typeof(utils) !== "undefined" && utils !== null) {
        if (_typeof(utils.id) !== "undefined") {
          gameSettings.id = utils.id;
        }
        if (_typeof(utils.async) !== "undefined" && utils.async) {
          gameSettings.async = "async";
        }
        if (_typeof(utils.defer) !== "undefined" && utils.defer) {
          gameSettings.defer = "defer";
        }
        if (_typeof(utils.crossorigin) !== "undefined") {
          gameSettings.crossorigin = utils.crossorigin;
        }
      }
      gameSettings.type = "text/javascript";
      gameSettings.src = config;
      if (hexByte) {
        gameSettings.onload = gameSettings.onreadystatechange = function () {
          savedGame = false;
          try {
            hexByte();
          } catch (app) {}
          ;
          gameSettings.onload = gameSettings.onreadystatechange = null;
        };
      }
      (app.d.head || app.d.getElementsByTagName("head")[0]).appendChild(gameSettings);
    };
    decoder.ca = function (app, config) {
      var decoder = config;
      decoder.prototype = Object.create(app.prototype);
      decoder.prototype.constructor = decoder;
      decoder.parent = app;
      return decoder;
    };
    decoder.da = function (app) {
      if ((app %= config.S) < 0) {
        return app + config.S;
      } else {
        return app;
      }
    };
    decoder.ea = function (app, config, utils) {
      return decoder.fa(utils, app, config);
    };
    decoder.fa = function (app, config, decoder) {
      if (app > decoder) {
        return decoder;
      } else if (app < config) {
        return config;
      } else if (Number.isFinite(app)) {
        return app;
      } else {
        return (config + decoder) * 0.5;
      }
    };
    decoder.ga = function (app, config, utils, hexByte) {
      if (config > app) {
        return decoder.ha(config, app + utils * hexByte);
      } else {
        return decoder.ia(config, app - utils * hexByte);
      }
    };
    decoder.ja = function (app, config, decoder, utils, hexByte) {
      return config + (app - config) * Math.pow(1 - utils, decoder / hexByte);
    };
    decoder.ka = function (app, config, decoder) {
      return app - (app - config) * decoder;
    };
    decoder.la = function (app, config) {
      return Math.sqrt(app * app + config * config);
    };
    decoder.ma = function () {
      return Math.random();
    };
    decoder._ = function (app) {
      return Math.floor(app);
    };
    decoder.na = function (app) {
      return Math.abs(app);
    };
    decoder.ha = function (app, config) {
      return Math.min(app, config);
    };
    decoder.ia = function (app, config) {
      return Math.max(app, config);
    };
    decoder.oa = function (app) {
      return Math.sin(app);
    };
    decoder.pa = function (app) {
      return Math.cos(app);
    };
    decoder.qa = function (app) {
      return Math.sqrt(app);
    };
    decoder.ra = function (app, config) {
      return Math.pow(app, config);
    };
    decoder.sa = function (app) {
      return Math.atan(app);
    };
    decoder.ta = function (app, config) {
      return Math.atan2(app, config);
    };
    decoder.ua = function (app, config, decoder, utils) {
      var hexByte = config + utils;
      if (app == null) {
        throw TypeError();
      }
      ;
      var gameSettings = app.length >>> 0;
      var savedGame = decoder >> 0;
      var savedData = savedGame < 0 ? Math.max(gameSettings + savedGame, 0) : Math.min(savedGame, gameSettings);
      var key = config >> 0;
      var detectMobileDevice = key < 0 ? Math.max(gameSettings + key, 0) : Math.min(key, gameSettings);
      var updateJoystickEnabled = hexByte === undefined ? gameSettings : hexByte >> 0;
      var updateJoystickColor = Math.min((updateJoystickEnabled < 0 ? Math.max(gameSettings + updateJoystickEnabled, 0) : Math.min(updateJoystickEnabled, gameSettings)) - detectMobileDevice, gameSettings - savedData);
      var updateJoystickMode = 1;
      for (detectMobileDevice < savedData && savedData < detectMobileDevice + updateJoystickColor && (updateJoystickMode = -1, detectMobileDevice += updateJoystickColor - 1, savedData += updateJoystickColor - 1); updateJoystickColor > 0;) {
        if (detectMobileDevice in app) {
          app[savedData] = app[detectMobileDevice];
        } else {
          delete app[savedData];
        }
        detectMobileDevice += updateJoystickMode;
        savedData += updateJoystickMode;
        updateJoystickColor--;
      }
      ;
      return app;
    };
    decoder.va = function (app, config) {
      return app + (config - app) * decoder.ma();
    };
    decoder.wa = function (app) {
      return app[parseInt(decoder.ma() * app.length)];
    };
    charCodes = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"].map(function (app) {
      return app.charCodeAt(0);
    });
    decoder.xa = function (app) {
      if (_typeof(app) == "undefined") {
        app = 16;
      }
      var config = "";
      for (var utils = 0; utils < app; utils++) {
        config += String.fromCharCode(charCodes[decoder._(decoder.ma() * charCodes.length)]);
      }
      ;
      return config;
    };
    decoder.ya = function (app, config, utils) {
      var hexByte = utils * (1 - config * 0.5);
      var gameSettings = Math.min(hexByte, 1 - hexByte);
      return decoder.za(app, gameSettings ? (utils - hexByte) / gameSettings : 0, hexByte);
    };
    decoder.za = function (app, config, utils) {
      var hexByte = (1 - decoder.na(utils * 2 - 1)) * config;
      var gameSettings = hexByte * (1 - decoder.na(app / 60 % 2 - 1));
      var savedGame = utils - hexByte / 2;
      if (app >= 0 && app < 60) {
        return [savedGame + hexByte, savedGame + gameSettings, savedGame];
      } else if (app >= 60 && app < 120) {
        return [savedGame + gameSettings, savedGame + hexByte, savedGame];
      } else if (app >= 120 && app < 180) {
        return [savedGame, savedGame + hexByte, savedGame + gameSettings];
      } else if (app >= 180 && app < 240) {
        return [savedGame, savedGame + gameSettings, savedGame + hexByte];
      } else if (app >= 240 && app < 300) {
        return [savedGame + gameSettings, savedGame, savedGame + hexByte];
      } else {
        return [savedGame + hexByte, savedGame, savedGame + gameSettings];
      }
    };
    decoder.Aa = function (app, config, utils) {
      $.get(app).fail(config).done(utils);
    };
    decoder.Ba = function (app, config, utils, hexByte) {
      var gameSettings = {
        type: "GET",
        url: app
      };
      var savedGame = {
        responseType: "arraybuffer"
      };
      savedGame.onprogress = function (app) {
        if (app.lengthComputable) {
          hexByte(app.loaded / app.total * 100);
        }
      };
      gameSettings.xhrFields = savedGame;
      $.ajax(gameSettings).fail(config).done(utils);
    };
    decoder.Ca = function () {
      return Date.now();
    };
    decoder.Da = function (app, config) {
      for (var decoder in app) {
        if (app.hasOwnProperty(decoder)) {
          config(decoder, app[decoder]);
        }
      }
    };
    decoder.Ea = function (app) {
      for (var config = app.length - 1; config > 0; config--) {
        var utils = decoder._(decoder.ma() * (config + 1));
        var hexByte = app[config];
        app[config] = app[utils];
        app[utils] = hexByte;
      }
      ;
      return app;
    };
    app.Fa = decoder.b("ArrayBuffer");
    app.Ga = decoder.b("DataView");
    app.Ha = function () {
      function app(app) {
        this.Ia = app;
        this.Ja = 0;
      }
      var config = "getInt8";
      app.prototype.Ka = function () {
        var app = this.Ia[config](this.Ja);
        this.Ja += 1;
        return app;
      };
      var utils = "getInt16";
      app.prototype.La = function () {
        var app = this.Ia[utils](this.Ja);
        this.Ja += 2;
        return app;
      };
      var hexByte = "getInt32";
      app.prototype.Ma = function () {
        var app = this.Ia[hexByte](this.Ja);
        this.Ja += 4;
        return app;
      };
      var gameSettings = "getFloat32";
      app.prototype.Na = function () {
        var app = this.Ia[gameSettings](this.Ja);
        this.Ja += 4;
        return app;
      };
      return app;
    }();
    app.Oa = function () {
      function app(app) {
        this.Ia = app;
        this.Ja = 0;
      }
      var config = "setInt8";
      app.prototype.Pa = function (app) {
        this.Ia[config](this.Ja, app);
        this.Ja += 1;
      };
      var utils = "setInt16";
      app.prototype.Qa = function (app) {
        this.Ia[utils](this.Ja, app);
        this.Ja += 2;
      };
      return app;
    }();
    decoder.Ra = function () {
      var gameSettings = false;
      function savedGame() {}
      var savedData = {};
      var key = "1eaom01c3pxu9wd3";
      var detectMobileDevice = $("#" + key);
      var updateJoystickEnabled = "JDHnkHtYwyXyVgG9";
      var updateJoystickColor = $("#" + updateJoystickEnabled);
      $("#adbl-continue").click(function () {
        updateJoystickColor.fadeOut(500);
        savedGame(false);
      });
      savedData.Sa = function (hexByte) {
        savedGame = hexByte;
        if (!gameSettings) {
          try {
            aiptag.cmd.player.push(function () {
              var hexByte = {
                AD_WIDTH: 960,
                AD_HEIGHT: 540,
                AD_FULLSCREEN: true,
                AD_CENTERPLAYER: false
              };
              hexByte.LOADING_TEXT = "loading advertisement";
              hexByte.PREROLL_ELEM = function () {
                return app.d.getElementById(key);
              };
              hexByte.AIP_COMPLETE = function (app) {
                savedGame(true);
                utils.f.h(detectMobileDevice, 1);
                utils.f.h(updateJoystickColor, 1);
                try {
                  ga("send", "event", "preroll", config.H.I + "_complete");
                } catch (hexByte) {}
              };
              hexByte.AIP_REMOVE = function () {};
              aiptag.adplayer = new aipPlayer(hexByte);
            });
            gameSettings = true;
          } catch (savedData) {}
        }
      };
      savedData.Ta = function () {
        if (_typeof(aiptag.adplayer) !== "undefined") {
          try {
            ga("send", "event", "preroll", config.H.I + "_request");
          } catch (app) {}
          ;
          utils.f.g(detectMobileDevice, 1);
          if (!hexByte.on) {
            aiptag.cmd.player.push(function () {
              aiptag.adplayer.startPreRoll();
            });
          }
        } else {
          try {
            ga("send", "event", "antiadblocker", config.H.I + "_start");
          } catch (gameSettings) {}
          ;
          (function app() {
            $("#adbl-1").text(decoder.U("index.game.antiadblocker.msg1"));
            $("#adbl-2").text(decoder.U("index.game.antiadblocker.msg2"));
            $("#adbl-3").text(decoder.U("index.game.antiadblocker.msg3"));
            $("#adbl-4").text(decoder.U("index.game.antiadblocker.msg4").replace("{0}", 10));
            $("#adbl-continue span").text(decoder.U("index.game.antiadblocker.continue"));
            utils.f.h($("#adbl-continue"), 1);
            utils.f.g(updateJoystickColor, 500);
            var hexByte = 10;
            for (var gameSettings = 0; gameSettings < 10; gameSettings++) {
              decoder.Y(function () {
                hexByte--;
                $("#adbl-4").text(decoder.U("index.game.antiadblocker.msg4").replace("{0}", hexByte));
                if (hexByte === 0) {
                  try {
                    ga("send", "event", "antiadblocker", config.H.I + "_complete");
                  } catch (app) {}
                  ;
                  utils.f.g($("#adbl-continue"), 200);
                }
              }, (gameSettings + 1) * 1000);
            }
          })();
        }
      };
      return savedData;
    };
    decoder.Ua = function (app, utils) {
      var gameSettings = $("#" + app);
      var savedGame = utils;
      var savedData = {};
      var key = false;
      savedData.Sa = function () {
        if (!key) {
          gameSettings.empty();
          gameSettings.append("<div id='" + savedGame + "'></div>");
          try {
            try {
              ga("send", "event", "banner", config.H.I + "_display");
            } catch (app) {}
            ;
            if (!hexByte.on) {
              aiptag.cmd.display.push(function () {
                aipDisplayTag.display(savedGame);
              });
            }
            key = true;
          } catch (utils) {}
        }
      };
      savedData.Va = function () {
        try {
          try {
            ga("send", "event", "banner", config.H.I + "_refresh");
          } catch (app) {}
          ;
          if (!hexByte.on) {
            aiptag.cmd.display.push(function () {
              aipDisplayTag.display(savedGame);
            });
          }
        } catch (utils) {}
      };
      return savedData;
    };
    app.Wa = function () {
      function app(app, config, decoder, utils, hexByte, gameSettings, savedGame, savedData, key, detectMobileDevice) {
        this.Xa = app;
        this.Ya = config;
        this.Za = null;
        this.$a = false;
        this._a = decoder;
        this.ab = utils;
        this.bb = hexByte;
        this.cb = gameSettings;
        this.db = savedGame || (key || hexByte) / 2;
        this.eb = savedData || (detectMobileDevice || gameSettings) / 2;
        this.fb = key || hexByte;
        this.gb = detectMobileDevice || gameSettings;
        this.hb = 0.5 - (this.db - this.fb * 0.5) / this.bb;
        this.ib = 0.5 - (this.eb - this.gb * 0.5) / this.cb;
        this.jb = this.bb / this.fb;
        this.kb = this.cb / this.gb;
      }
      app.lb = function () {
        return new app("", null, 0, 0, 0, 0, 0, 0, 0, 0);
      };
      app.mb = function (config, utils, hexByte) {
        return new app(config, utils, hexByte.x, hexByte.y, hexByte.w, hexByte.h, hexByte.px, hexByte.py, hexByte.pw, hexByte.ph);
      };
      app.prototype.nb = function () {
        if (!this.$a) {
          if (this.Ya != null) {
            this.Za = new utils.k.n(this.Ya, new utils.k.r(this._a, this.ab, this.bb, this.cb));
          }
          this.$a = true;
        }
        return this.Za;
      };
      app.prototype.ob = function () {
        if (this.Za != null) {
          this.Za.destroy();
        }
      };
      return app;
    }();
    app.pb = function () {
      function config(app, config, decoder, utils, hexByte, gameSettings, savedGame, savedData, key, detectMobileDevice, updateJoystickEnabled, updateJoystickColor, updateJoystickMode, updateJoystickPosition, updateJoystickCoordinates, updateJoystickSize, processPlayerData, createJoystick) {
        this.qb = app;
        this.rb = config;
        this.sb = decoder;
        this.tb = utils;
        this.ub = hexByte;
        this.vb = gameSettings;
        this.wb = savedGame;
        this.xb = savedData;
        this.yb = key;
        this.zb = detectMobileDevice;
        this.Ab = updateJoystickEnabled;
        this.Bb = updateJoystickColor;
        this.Cb = updateJoystickMode;
        this.Db = updateJoystickPosition;
        this.Eb = updateJoystickCoordinates;
        this.Fb = updateJoystickSize;
        this.Gb = processPlayerData;
        this.Hb = createJoystick;
      }
      config.prototype.ob = function () {
        for (var app = 0; app < this.qb.length; app++) {
          this.qb[app].dispose();
          this.qb[app].destroy();
        }
        ;
        this.qb = [];
        for (var config = 0; config < this.rb.length; config++) {
          this.rb[config].ob();
        }
        ;
        this.rb = [];
      };
      config.lb = function () {
        var utils = new config.Ib(app.Kb.Jb, app.Kb.Jb);
        var hexByte = new config.Lb("#ffffff", [app.Kb.Jb], [app.Kb.Jb]);
        return new config([], [], {}, utils, {}, new config.Mb(app.Kb.Jb), {}, hexByte, {}, new config.Nb("", hexByte, utils), {}, new config.Ob([app.Kb.Jb]), {}, new config.Ob([app.Kb.Jb]), {}, new config.Ob([app.Kb.Jb]), {}, new config.Ob([app.Kb.Jb]));
      };
      config.Pb = function (utils, hexByte, gameSettings, savedGame) {
        var savedData = new config.Ib(app.Kb.Jb, app.Kb.Jb);
        var key = new config.Lb("#ffffff", [utils], [hexByte]);
        return new config([], [], {}, savedData, {}, new config.Mb(app.Kb.Jb), {}, key, {}, new config.Nb("", key, savedData), {}, new config.Ob([gameSettings]), {}, new config.Ob([savedGame]), {}, new config.Ob([app.Kb.Jb]), {}, new config.Ob([app.Kb.Jb]));
      };
      config.Qb = function (app, utils, hexByte, gameSettings) {
        var savedGame = {};
        decoder.Da(app.colorDict, function (app, config) {
          savedGame[app] = "#" + config;
        });
        var savedData = {};
        for (var key = 0; key < app.skinArrayDict.length; key++) {
          var detectMobileDevice = app.skinArrayDict[key];
          savedData[detectMobileDevice.id] = new config.Lb(savedGame[detectMobileDevice.prime], detectMobileDevice.base.map(function (app) {
            return utils[app];
          }), detectMobileDevice.glow.map(function (app) {
            return utils[app];
          }));
        }
        ;
        var updateJoystickEnabled;
        var updateJoystickColor = app.skinUnknown;
        updateJoystickEnabled = new config.Lb(savedGame[updateJoystickColor.prime], updateJoystickColor.base.map(function (app) {
          return utils[app];
        }), updateJoystickColor.glow.map(function (app) {
          return utils[app];
        }));
        var updateJoystickMode = {};
        decoder.Da(app.eyesDict, function (app, hexByte) {
          updateJoystickMode[parseInt(app)] = new config.Ob(hexByte.base.map(function (app) {
            return utils[app.region];
          }));
        });
        var updateJoystickPosition = new config.Ob(app.eyesUnknown.base.map(function (app) {
          return utils[app.region];
        }));
        var updateJoystickCoordinates = {};
        decoder.Da(app.mouthDict, function (app, hexByte) {
          updateJoystickCoordinates[parseInt(app)] = new config.Ob(hexByte.base.map(function (app) {
            return utils[app.region];
          }));
        });
        var updateJoystickSize = new config.Ob(app.mouthUnknown.base.map(function (app) {
          return utils[app.region];
        }));
        var processPlayerData = {};
        decoder.Da(app.hatDict, function (app, hexByte) {
          processPlayerData[parseInt(app)] = new config.Ob(hexByte.base.map(function (app) {
            return utils[app.region];
          }));
        });
        var createJoystick = new config.Ob(app.hatUnknown.base.map(function (app) {
          return utils[app.region];
        }));
        var parsePlayerData = {};
        decoder.Da(app.glassesDict, function (app, hexByte) {
          parsePlayerData[parseInt(app)] = new config.Ob(hexByte.base.map(function (app) {
            return utils[app.region];
          }));
        });
        var validateParameter = new config.Ob(app.glassesUnknown.base.map(function (app) {
          return utils[app.region];
        }));
        var validatePlayerNameFormat = {};
        decoder.Da(app.portionDict, function (app, hexByte) {
          validatePlayerNameFormat[app = parseInt(app)] = new config.Ib(utils[hexByte.base], utils[hexByte.glow]);
        });
        var extractRealName;
        var savedOco = app.portionUnknown;
        extractRealName = new config.Ib(utils[savedOco.base], utils[savedOco.glow]);
        var savedSw = {};
        decoder.Da(app.abilityDict, function (app, hexByte) {
          savedSw[app = parseInt(app)] = new config.Mb(utils[hexByte.base]);
        });
        var savedImages;
        var savedImageVersion = app.abilityUnknown;
        savedImages = new config.Mb(utils[savedImageVersion.base]);
        var customWear = {};
        decoder.Da(app.teamDict, function (app, hexByte) {
          customWear[app = parseInt(app)] = new config.Nb(hexByte.title, new config.Lb(savedGame[hexByte.skin.prime], null, hexByte.skin.glow.map(function (app) {
            return utils[app];
          })), new config.Ib(null, utils[hexByte.portion.glow]));
        });
        var customSkin = new config.Nb({}, updateJoystickEnabled, extractRealName);
        return new config(hexByte, gameSettings, validatePlayerNameFormat, extractRealName, savedSw, savedImages, savedData, updateJoystickEnabled, customWear, customSkin, updateJoystickMode, updateJoystickPosition, updateJoystickCoordinates, updateJoystickSize, processPlayerData, createJoystick, parsePlayerData, validateParameter);
      };
      config.prototype.Rb = function (config) {
        var utils = decoder.Ea(Object.keys(this.wb)).slice(0, config);
        var hexByte = decoder.Ea(Object.keys(this.Ab)).slice(0, config);
        var gameSettings = decoder.Ea(Object.keys(this.Cb)).slice(0, config);
        var savedGame = decoder.Ea(Object.keys(this.Eb)).slice(0, config);
        var savedData = decoder.Ea(Object.keys(this.Gb)).slice(0, config);
        var key = [];
        for (var detectMobileDevice = 0; detectMobileDevice < config; detectMobileDevice++) {
          var updateJoystickEnabled = utils.length > 0 ? utils[detectMobileDevice % utils.length] : 0;
          var updateJoystickColor = hexByte.length > 0 ? hexByte[detectMobileDevice % hexByte.length] : 0;
          var updateJoystickMode = gameSettings.length > 0 ? gameSettings[detectMobileDevice % gameSettings.length] : 0;
          var updateJoystickPosition = savedGame.length > 0 ? savedGame[detectMobileDevice % savedGame.length] : 0;
          var updateJoystickCoordinates = savedData.length > 0 ? savedData[detectMobileDevice % savedData.length] : 0;
          key.push(new app.Sb(updateJoystickEnabled, updateJoystickColor, updateJoystickMode, updateJoystickPosition, updateJoystickCoordinates));
        }
        ;
        return key;
      };
      config.prototype.Tb = function (app) {
        if (this.wb.hasOwnProperty(app)) {
          return this.wb[app];
        } else {
          return this.xb;
        }
      };
      config.prototype.Ub = function (app) {
        if (this.yb.hasOwnProperty(app)) {
          return this.yb[app];
        } else {
          return this.zb;
        }
      };
      config.prototype.Vb = function (app) {
        if (this.Ab.hasOwnProperty(app)) {
          return this.Ab[app];
        } else {
          return this.Bb;
        }
      };
      config.prototype.Wb = function (app) {
        if (this.Cb.hasOwnProperty(app)) {
          return this.Cb[app];
        } else {
          return this.Db;
        }
      };
      config.prototype.Xb = function (app) {
        if (this.Gb.hasOwnProperty(app)) {
          return this.Gb[app];
        } else {
          return this.Hb;
        }
      };
      config.prototype.Yb = function (app) {
        if (this.Eb.hasOwnProperty(app)) {
          return this.Eb[app];
        } else {
          return this.Fb;
        }
      };
      config.prototype.Zb = function (app) {
        if (this.sb.hasOwnProperty(app)) {
          return this.sb[app];
        } else {
          return this.tb;
        }
      };
      config.prototype.$b = function (app) {
        if (this.ub.hasOwnProperty(app)) {
          return this.ub[app];
        } else {
          return this.vb;
        }
      };
      config.Nb = function app(config, decoder, utils) {
        this._b = config;
        this.ac = decoder;
        this.bc = utils;
      };
      config.Lb = function app(config, decoder, utils) {
        this.cc = config;
        this.dc = decoder;
        this.ec = utils;
      };
      config.Ob = function app(config) {
        this.dc = config;
      };
      config.Ib = function app(config, decoder) {
        this.dc = config;
        this.ec = decoder;
      };
      config.Mb = function app(config) {
        this.dc = config;
      };
      return config;
    }();
    app.Kb = function () {
      function config() {
        var config = utils.k.m.from("/images/wear-ability.png");
        this.fc = new app.Wa("magnet_ability", config, 158, 86, 67, 124, 148, 63.5, 128, 128);
        this.gc = new app.Wa("velocity_ability", config, 158, 4, 87, 74, 203, 63.5, 128, 128);
        this.hc = new app.Wa("flex_ability", config, 4, 4, 146, 146, 63.5, 63.5, 128, 128);
        var zigzag = utils.k.m.from("https://wormup.in/assets/images/zigzagability.png");
        this.pwrFlex1 = new app.Wa("flex_ability", zigzag, 158, 4, 87, 74, 203, 63.5, 128, 128);
        var newTexture = utils.k.m.from("https://i.imgur.com/LFiCido.png");
        this.pwrFlex = new app.Wa("flex_ability", newTexture, 156, 140, 87, 60, 170, 128.5, 128, 128);
        var newTexture2 = utils.k.m.from("https://i.imgur.com/LvJ1RxC.png");
        this.pwrFlex2 = new app.Wa("flex_ability2", newTexture2, 156, 4, 87, 74, 285, 63.5, 128, 128);
        var hexByte;
        var gameSettings = utils.k.m.from("/images/def-look.png");
        var savedGame = new app.Wa("def_eyes", gameSettings, 0, 0, 42, 80, 75, 64, 128, 128);
        var savedData = new app.Wa("def_mouth", gameSettings, 46, 0, 20, 48, 109, 63, 128, 128);
        var key = new app.Wa("def_skin_glow", gameSettings, 70, 0, 32, 32, 0, 0, 0, 0);
        var detectMobileDevice = new app.Wa("def_skin_base", gameSettings, 46, 52, 64, 64, 0, 0, 0, 0);
        var updateJoystickEnabled = app.pb.Pb(detectMobileDevice, key, savedGame, savedData);
        this.ic = new app.jc({}, updateJoystickEnabled);
        this.kc = -10000;
        this.lc = -10000;
        this.mc = ((hexByte = app.c.document.createElement("canvas")).width = 80, hexByte.height = 80, {
          nc: hexByte,
          oc: hexByte.getContext("2d"),
          Za: new utils.k.n(utils.k.m.from(hexByte))
        });
        this.pc = null;
        this.qc = [];
      }
      config.Jb = app.Wa.lb();
      config.prototype.Sa = function () {};
      config.prototype.rc = function (config, utils, hexByte) {
        var gameSettings = this;
        var savedGame = this.ic.sc();
        if (savedGame > 0 && decoder.Ca() - this.kc < 1200000) {
          if (config != null) {
            config();
          }
          return;
        }
        ;
        if (this.pc != null && !this.pc.tc()) {
          if (decoder.Ca() - this.kc < 300000) {
            if (config != null) {
              config();
            }
            return;
          }
          ;
          this.pc.uc();
          this.pc = null;
        }
        ;
        var savedData = new app.vc(savedGame);
        savedData.wc(function (app, config) {
          if (savedData === gameSettings.pc && hexByte != null) {
            hexByte(app, config);
          }
        });
        savedData.xc(function (app) {
          if (savedData === gameSettings.pc && utils != null) {
            utils(app);
          }
        });
        savedData.yc(function () {
          if (savedData === gameSettings.pc && utils != null) {
            utils(Error());
          }
        });
        savedData.zc(function () {
          if (savedData === gameSettings.pc && config != null) {
            config();
          }
        });
        savedData.Ac(function (app) {
          if (savedData === gameSettings.pc) {
            gameSettings.lc = decoder.Ca();
            gameSettings.pc = null;
            gameSettings.Bc();
            gameSettings.ic.Cc().ob();
            gameSettings.ic = app;
            if (config != null) {
              config();
            }
            gameSettings.Dc();
            return;
          }
          ;
          try {
            app.Cc().ob();
          } catch (utils) {}
        });
        savedData.Ec();
        this.kc = decoder.Ca();
        this.pc = savedData;
      };
      config.prototype.Bc = function () {};
      config.prototype.Fc = function () {
        return this.ic.sc() > 0;
      };
      config.prototype.Gc = function () {
        return this.ic.Hc();
      };
      config.prototype.Ic = function () {
        return this.mc;
      };
      config.prototype.Jc = function (app) {
        this.qc.push(app);
      };
      config.prototype.Dc = function () {
        for (var app = 0; app < this.qc.length; app++) {
          this.qc[app]();
        }
      };
      config.prototype.Cc = function () {
        return this.ic.Cc();
      };
      return config;
    }();
    app.Kc = function () {
      function app(app) {
        this.Lc = app;
      }
      app.prototype.Mc = function (app) {
        return this.Lc[app];
      };
      app.Nc = function () {
        function config() {
          this.Oc = [];
        }
        config.prototype.Pc = function (config, decoder) {
          for (var utils = 0; utils < this.Oc.length; utils++) {
            if (this.Oc[utils].Qc === config) {
              throw Error();
            }
          }
          ;
          this.Oc.push(new app.Rc(config, decoder));
          return this;
        };
        config.prototype.Sc = function () {
          var config = 0;
          for (var decoder = 0; decoder < this.Oc.length; decoder++) {
            config += this.Oc[decoder].Tc;
          }
          ;
          var utils = {};
          var hexByte = 0;
          for (var gameSettings = 0; gameSettings < this.Oc.length; gameSettings++) {
            var savedGame = this.Oc[gameSettings];
            savedGame.Tc = savedGame.Tc / config;
            savedGame.Uc = hexByte;
            savedGame.Vc = hexByte + savedGame.Tc;
            hexByte = savedGame.Vc;
            utils[savedGame.Qc] = savedGame;
          }
          ;
          return new app(utils);
        };
        return config;
      }();
      app.Rc = function () {
        function app(app, config) {
          this.Qc = app;
          this.Tc = config;
          this.Uc = 0;
          this.Vc = 0;
        }
        app.prototype.Wc = function (app) {
          return this.Uc + (this.Vc - this.Uc) * app;
        };
        return app;
      }();
      return app;
    }();
    app.Xc = function () {
      function hexByte() {
        this.Yc = new utils.k.l();
        this.Yc.sortableChildren = true;
        this.Zc = new updateJoystickEnabled();
        this.Zc.zIndex = savedData * ((key + 1) * 2 + 1 + 3);
        this.$c = 0;
        this._c = Array(key);
        this._c[0] = this.ad(0, new app.bd(), new app.bd());
        for (var config = 1; config < key; config++) {
          this._c[config] = this.ad(config, new app.bd(), new app.bd());
        }
        ;
        this.cd = 0;
        this.dd = 0;
        this.ed = 0;
      }
      var savedGame;
      var savedData = 0.001;
      var key = 797;
      var detectMobileDevice = config.T * 0.1;
      hexByte.fd = key;
      hexByte.prototype.ad = function (app, config, decoder) {
        var utils = new updateJoystickColor(config, decoder);
        config.gd.zIndex = savedData * ((key - app) * 2 + 1 + 3);
        decoder.gd.zIndex = savedData * ((key - app) * 2 - 2 + 3);
        return utils;
      };
      hexByte.prototype.hd = function (config, decoder, utils, hexByte, gameSettings, savedGame, savedData, key) {
        var detectMobileDevice = utils.dc;
        var updateJoystickEnabled = config === app.jd.id ? decoder.ac.ec : utils.ec;
        if (detectMobileDevice.length > 0 && updateJoystickEnabled.length > 0) {
          for (var updateJoystickColor = 0; updateJoystickColor < this._c.length; updateJoystickColor++) {
            this._c[updateJoystickColor].ld.kd(detectMobileDevice[updateJoystickColor % detectMobileDevice.length]);
            this._c[updateJoystickColor].md.kd(updateJoystickEnabled[updateJoystickColor % updateJoystickEnabled.length]);
            this._c[updateJoystickColor].ld.nd(key);
            this._c[updateJoystickColor].md.nd(key);
          }
        }
        ;
        this.Zc.hd(hexByte, gameSettings, savedGame, savedData);
      };
      (savedGame = decoder.ca(utils.k.l, function () {
        utils.k.l.call(this);
        this.sortableChildren = true;
        this.od = [];
        this.pd = [];
        this.qd = [];
        this.rd = [];
        this.sd = new utils.k.l();
        this.td = [];
        for (var config = 0; config < 4; config++) {
          var decoder = new app.bd();
          decoder.kd(ooo.ud.fc);
          this.sd.addChild(decoder.gd);
          this.td.push(decoder);
        }
        ;
        this.sd.zIndex = 0.0011;
        this.addChild(this.sd);
        this.vd();
        this.wd = new app.bd();
        this.wd.kd(ooo.ud.gc);
        this.wd.gd.zIndex = 0.001;
        this.addChild(this.wd.gd);
        this.xd();
        this.pwr_flex1 = new app.bd();
        this.pwr_flex1.kd(ooo.ud.pwrFlex1);
        this.pwr_flex1.gd.zIndex = 0.001;
        this.addChild(this.pwr_flex1.gd);
        this.pwr_flex = new app.bd();
        this.pwr_flex.kd(ooo.ud.pwrFlex);
        this.pwr_flex.gd.zIndex = 0.001;
        this.addChild(this.pwr_flex.gd);
        this.pwr_flex2 = new app.bd();
        this.pwr_flex2.kd(ooo.ud.pwrFlex2);
        this.pwr_flex2.gd.zIndex = 0.001;
        this.addChild(this.pwr_flex2.gd);
        this.disableFlex();
      })).prototype.hd = function (app, config, decoder, utils) {
        this.yd(0.002, this.od, app.dc);
        this.yd(0.003, this.pd, config.dc);
        this.yd(0.004, this.rd, utils.dc);
        this.yd(0.005, this.qd, decoder.dc);
      };
      savedGame.prototype.yd = function (config, decoder, utils) {
        while (utils.length > decoder.length) {
          var hexByte = new app.bd();
          decoder.push(hexByte);
          this.addChild(hexByte.zd());
        }
        ;
        while (utils.length < decoder.length) {
          decoder.pop().G();
        }
        ;
        var gameSettings = config;
        for (var savedGame = 0; savedGame < utils.length; savedGame++) {
          gameSettings += 0.0001;
          var savedData = decoder[savedGame];
          savedData.kd(utils[savedGame]);
          savedData.gd.zIndex = gameSettings;
        }
      };
      savedGame.prototype.Ad = function (app, config, decoder, utils) {
        this.visible = true;
        this.position.set(app, config);
        this.rotation = utils;
        for (var hexByte = 0; hexByte < this.od.length; hexByte++) {
          this.od[hexByte].Bd(decoder);
        }
        ;
        for (var gameSettings = 0; gameSettings < this.pd.length; gameSettings++) {
          this.pd[gameSettings].Bd(decoder);
        }
        ;
        for (var savedGame = 0; savedGame < this.qd.length; savedGame++) {
          this.qd[savedGame].Bd(decoder);
        }
        ;
        for (var savedData = 0; savedData < this.rd.length; savedData++) {
          this.rd[savedData].Bd(decoder);
        }
      };
      savedGame.prototype.Cd = function () {
        this.visible = false;
      };
      savedGame.prototype.Dd = function (app, config, decoder, utils) {
        this.sd.visible = true;
        var hexByte = decoder / 1000;
        var gameSettings = 1 / this.td.length;
        for (var savedGame = 0; savedGame < this.td.length; savedGame++) {
          var savedData = 1 - (hexByte + gameSettings * savedGame) % 1;
          this.td[savedGame].gd.alpha = 1 - savedData;
          this.td[savedGame].Bd(config * (0.5 + savedData * 4.5));
        }
      };
      savedGame.prototype.vd = function () {
        this.sd.visible = false;
      };
      savedGame.prototype.Ed = function (app, config, utils, hexByte) {
        this.wd.gd.visible = gameSettings.vp;
        this.wd.gd.alpha = decoder.ga(this.wd.gd.alpha, app.Fd ? 0.9 : 0.4, hexByte, 0.0025);
        this.wd.Bd(config);
      };
      savedGame.prototype.xd = function () {
        this.wd.gd.visible = false;
      };
      savedGame.prototype.activeFlex = function (app, config, utils, hexByte) {
        // إظهار الصورة الأولى إذا كانت القيمة = 1

        this.pwr_flex1.gd.visible = gameSettings.flx === 1;
        this.pwr_flex1.gd.alpha = decoder.ga(this.wd.gd.alpha, app.Fd ? 1 : 1, hexByte, 1);
        this.pwr_flex1.Bd(config);

        // إظهار الصورة الأولى إذا كانت القيمة = 2

        this.pwr_flex.gd.visible = gameSettings.flx === 2;
        this.pwr_flex.gd.alpha = decoder.ga(this.wd.gd.alpha, app.Fd ? 0.9 : 0.5, hexByte, 0.0025);
        this.pwr_flex.Bd(config);

        // إظهار الصورة الثانية إذا كانت القيمة = 3

        this.pwr_flex2.gd.visible = gameSettings.flx === 3;
        this.pwr_flex2.gd.alpha = decoder.ga(this.wd.gd.alpha, app.Fd ? 0.9 : 0.5, hexByte, 0.0025);
        this.pwr_flex2.Bd(config);
      };
      savedGame.prototype.disableFlex = function () {
        this.pwr_flex1.gd.visible = false;
        this.pwr_flex.gd.visible = false;
        this.pwr_flex2.gd.visible = false;
      };
      var updateJoystickEnabled = savedGame;
      hexByte.prototype.Gd = function (app) {
        return this.dd + this.ed * decoder.oa(app * detectMobileDevice - this.cd);
      };
      hexByte.prototype.Hd = function (hexByte, gameSettings, savedGame, savedData) {
        var key;
        var detectMobileDevice;
        var updateJoystickEnabled;
        var updateJoystickMode;
        var updateJoystickPosition;
        var updateJoystickCoordinates;
        var updateJoystickSize;
        var processPlayerData;
        var createJoystick = hexByte.Id * 2;
        var parsePlayerData = hexByte.Jd;
        var validateParameter = hexByte.Kd;
        var validatePlayerNameFormat = validateParameter * 4 - 3;
        var extractRealName = validatePlayerNameFormat;
        this.cd = gameSettings / 400 * config.T;
        this.dd = createJoystick * 1.5;
        this.ed = createJoystick * 0.15 * hexByte.Ld;
        if (savedData(detectMobileDevice = parsePlayerData[0], updateJoystickCoordinates = parsePlayerData[1])) {
          updateJoystickEnabled = parsePlayerData[2];
          updateJoystickSize = parsePlayerData[3];
          updateJoystickMode = parsePlayerData[4];
          processPlayerData = parsePlayerData[5];
          var savedOco = decoder.ta(processPlayerData + updateJoystickCoordinates * 2 - updateJoystickSize * 3, updateJoystickMode + detectMobileDevice * 2 - updateJoystickEnabled * 3);
          this.Zc.Ad(detectMobileDevice, updateJoystickCoordinates, createJoystick, savedOco);
          this._c[0].Ad(detectMobileDevice, updateJoystickCoordinates, createJoystick, this.Gd(0), savedOco);
          this._c[1].Ad(detectMobileDevice * 0.64453125 + updateJoystickEnabled * 0.45703125 + updateJoystickMode * -0.1015625, updateJoystickCoordinates * 0.64453125 + updateJoystickSize * 0.45703125 + processPlayerData * -0.1015625, createJoystick, this.Gd(1), updateJoystickColor.Md(this._c[0], this._c[2]));
          this._c[2].Ad(detectMobileDevice * 0.375 + updateJoystickEnabled * 0.75 + updateJoystickMode * -0.125, updateJoystickCoordinates * 0.375 + updateJoystickSize * 0.75 + processPlayerData * -0.125, createJoystick, this.Gd(2), updateJoystickColor.Md(this._c[1], this._c[3]));
          this._c[3].Ad(detectMobileDevice * 0.15234375 + updateJoystickEnabled * 0.94921875 + updateJoystickMode * -0.1015625, updateJoystickCoordinates * 0.15234375 + updateJoystickSize * 0.94921875 + processPlayerData * -0.1015625, createJoystick, this.Gd(3), updateJoystickColor.Md(this._c[2], this._c[4]));
        } else {
          this.Zc.Cd();
          this._c[0].Cd();
          this._c[1].Cd();
          this._c[2].Cd();
          this._c[3].Cd();
        }
        ;
        var savedSw = 4;
        for (var savedImages = 2, savedImageVersion = validateParameter * 2 - 4; savedImages < savedImageVersion; savedImages += 2) {
          if (savedData(detectMobileDevice = parsePlayerData[savedImages], updateJoystickCoordinates = parsePlayerData[savedImages + 1])) {
            key = parsePlayerData[savedImages - 2];
            updateJoystickPosition = parsePlayerData[savedImages - 1];
            updateJoystickEnabled = parsePlayerData[savedImages + 2];
            updateJoystickSize = parsePlayerData[savedImages + 3];
            updateJoystickMode = parsePlayerData[savedImages + 4];
            processPlayerData = parsePlayerData[savedImages + 5];
            this._c[savedSw].Ad(detectMobileDevice, updateJoystickCoordinates, createJoystick, this.Gd(savedSw), updateJoystickColor.Md(this._c[savedSw - 1], this._c[savedSw + 1]));
            savedSw++;
            this._c[savedSw].Ad(key * -0.06640625 + detectMobileDevice * 0.84375 + updateJoystickEnabled * 0.2578125 + updateJoystickMode * -0.03515625, updateJoystickPosition * -0.06640625 + updateJoystickCoordinates * 0.84375 + updateJoystickSize * 0.2578125 + processPlayerData * -0.03515625, createJoystick, this.Gd(savedSw), updateJoystickColor.Md(this._c[savedSw - 1], this._c[savedSw + 1]));
            savedSw++;
            this._c[savedSw].Ad(key * -0.0625 + detectMobileDevice * 0.5625 + updateJoystickEnabled * 0.5625 + updateJoystickMode * -0.0625, updateJoystickPosition * -0.0625 + updateJoystickCoordinates * 0.5625 + updateJoystickSize * 0.5625 + processPlayerData * -0.0625, createJoystick, this.Gd(savedSw), updateJoystickColor.Md(this._c[savedSw - 1], this._c[savedSw + 1]));
            savedSw++;
            this._c[savedSw].Ad(key * -0.03515625 + detectMobileDevice * 0.2578125 + updateJoystickEnabled * 0.84375 + updateJoystickMode * -0.06640625, updateJoystickPosition * -0.03515625 + updateJoystickCoordinates * 0.2578125 + updateJoystickSize * 0.84375 + processPlayerData * -0.06640625, createJoystick, this.Gd(savedSw), updateJoystickColor.Md(this._c[savedSw - 1], this._c[savedSw + 1]));
            savedSw++;
          } else {
            this._c[savedSw].Cd();
            savedSw++;
            this._c[savedSw].Cd();
            savedSw++;
            this._c[savedSw].Cd();
            savedSw++;
            this._c[savedSw].Cd();
            savedSw++;
          }
        }
        ;
        if (savedData(detectMobileDevice = parsePlayerData[validateParameter * 2 - 4], updateJoystickCoordinates = parsePlayerData[validateParameter * 2 - 3])) {
          key = parsePlayerData[validateParameter * 2 - 6];
          updateJoystickPosition = parsePlayerData[validateParameter * 2 - 5];
          updateJoystickEnabled = parsePlayerData[validateParameter * 2 - 2];
          updateJoystickSize = parsePlayerData[validateParameter * 2 - 1];
          this._c[validatePlayerNameFormat - 5].Ad(detectMobileDevice, updateJoystickCoordinates, createJoystick, this.Gd(validatePlayerNameFormat - 5), updateJoystickColor.Md(this._c[validatePlayerNameFormat - 6], this._c[validatePlayerNameFormat - 4]));
          this._c[validatePlayerNameFormat - 4].Ad(key * -0.1015625 + detectMobileDevice * 0.94921875 + updateJoystickEnabled * 0.15234375, updateJoystickPosition * -0.1015625 + updateJoystickCoordinates * 0.94921875 + updateJoystickSize * 0.15234375, createJoystick, this.Gd(validatePlayerNameFormat - 4), updateJoystickColor.Md(this._c[validatePlayerNameFormat - 5], this._c[validatePlayerNameFormat - 3]));
          this._c[validatePlayerNameFormat - 3].Ad(key * -0.125 + detectMobileDevice * 0.75 + updateJoystickEnabled * 0.375, updateJoystickPosition * -0.125 + updateJoystickCoordinates * 0.75 + updateJoystickSize * 0.375, createJoystick, this.Gd(validatePlayerNameFormat - 3), updateJoystickColor.Md(this._c[validatePlayerNameFormat - 4], this._c[validatePlayerNameFormat - 2]));
          this._c[validatePlayerNameFormat - 2].Ad(key * -0.1015625 + detectMobileDevice * 0.45703125 + updateJoystickEnabled * 0.64453125, updateJoystickPosition * -0.1015625 + updateJoystickCoordinates * 0.45703125 + updateJoystickSize * 0.64453125, createJoystick, this.Gd(validatePlayerNameFormat - 2), updateJoystickColor.Md(this._c[validatePlayerNameFormat - 3], this._c[validatePlayerNameFormat - 1]));
          this._c[validatePlayerNameFormat - 1].Ad(updateJoystickEnabled, updateJoystickSize, createJoystick, this.Gd(validatePlayerNameFormat - 1), updateJoystickColor.Md(this._c[validatePlayerNameFormat - 2], this._c[validatePlayerNameFormat - 1]));
        } else {
          this._c[validatePlayerNameFormat - 5].Cd();
          this._c[validatePlayerNameFormat - 4].Cd();
          this._c[validatePlayerNameFormat - 3].Cd();
          this._c[validatePlayerNameFormat - 2].Cd();
          this._c[validatePlayerNameFormat - 1].Cd();
        }
        if (this.$c === 0 && extractRealName > 0) {
          this.Yc.addChild(this.Zc);
        }
        if (this.$c > 0 && extractRealName === 0) {
          utils.k.F.G(this.Zc);
        }
        while (this.$c < extractRealName) {
          this.Yc.addChild(this._c[this.$c].ld.zd());
          this.Yc.addChild(this._c[this.$c].md.zd());
          this.$c += 1;
        }
        ;
        while (this.$c > extractRealName) {
          this.$c -= 1;
          this._c[this.$c].md.G();
          this._c[this.$c].ld.G();
        }
        ;
        var customWear = hexByte.Nd[app.Pd.Od];
        if (this._c[0].Qd() && customWear != null && customWear.Rd) {
          this.Zc.Dd(hexByte, createJoystick, gameSettings, savedGame);
        } else {
          this.Zc.vd();
        }
        var customSkin = hexByte.Nd[app.Pd.Sd];
        if (this._c[0].Qd() && customSkin != null && customSkin.Rd) {
          this.Zc.Ed(hexByte, createJoystick, gameSettings, savedGame);
        } else {
          this.Zc.xd();
        }
        var _0x4bb1aa = hexByte.Nd[app.Pd.Yd];
        if (this._c[0].Qd() && _0x4bb1aa != null && _0x4bb1aa.Rd) {
          this.Zc.activeFlex(hexByte, createJoystick, gameSettings, savedGame);
        } else {
          this.Zc.disableFlex();
        }
      };
      var updateJoystickColor = function () {
        function app(app, config) {
          this.ld = app;
          this.ld.Td(false);
          this.md = config;
          this.md.Td(false);
        }
        app.prototype.Ad = function (app, config, decoder, utils, hexByte) {
          this.ld.Td(true);
          this.ld.Ud(app, config);
          this.ld.Bd(decoder);
          this.ld.Vd(hexByte);
          this.md.Td(true);
          this.md.Ud(app, config);
          this.md.Bd(utils);
          this.md.Vd(hexByte);
        };
        app.prototype.Cd = function () {
          this.ld.Td(false);
          this.md.Td(false);
        };
        app.prototype.Qd = function () {
          return this.ld.Qd();
        };
        app.Md = function (app, config) {
          return decoder.ta(app.ld.gd.position.y - config.ld.gd.position.y, app.ld.gd.position.x - config.ld.gd.position.x);
        };
        return app;
      }();
      return hexByte;
    }();
    app.Pd = function () {
      function app(app) {
        this.Wd = app;
        this.Rd = false;
        this.Xd = 1;
      }
      app.Sd = 0;
      app.Yd = 1;
      app.Od = 2;
      app.Zd = 6;
      app.$d = 3;
      app._d = 4;
      app.ae = 5;
      return app;
    }();
    app.jc = function () {
      function config(app, config) {
        this.be = app;
        this.ce = config;
      }
      config.de = new config({}, app.pb.lb());
      config.prototype.sc = function () {
        return this.be.revision;
      };
      config.prototype.Hc = function () {
        return this.be;
      };
      config.prototype.Cc = function () {
        return this.ce;
      };
      return config;
    }();
    app.vc = function () {
      function hexByte(app) {
        this.ee = (++hexByte.fe, function (app, config) {});
        this.ge = app;
        this.he = null;
        this.ie = null;
        this.je = null;
        this.ke = null;
        this.le = null;
        this.me = false;
        this.ne = false;
        this.oe = false;
      }
      hexByte.pe = {
        qe: "0x0",
        re: "0x1",
        se: "0x2",
        te: "0x3",
        ue: "0x4"
      };
      hexByte.fe = 100000;
      hexByte.ve = new app.Kc.Nc().Pc(hexByte.pe.qe, 1).Pc(hexByte.pe.re, 10).Pc(hexByte.pe.se, 50).Pc(hexByte.pe.te, 15).Pc(hexByte.pe.ue, 5).Sc();
      hexByte.prototype.Ac = function (app) {
        this.he = app;
      };
      hexByte.prototype.zc = function (app) {
        this.ie = app;
      };
      hexByte.prototype.xc = function (app) {
        this.je = app;
      };
      hexByte.prototype.yc = function (app) {
        this.ke = app;
      };
      hexByte.prototype.wc = function (app) {
        this.le = app;
      };
      hexByte.prototype.tc = function () {
        return this.oe;
      };
      hexByte.prototype.uc = function () {
        this.me = true;
      };
      hexByte.prototype.Ec = function () {
        if (!this.ne) {
          this.ne = true;
          if (this.me) {
            this.we();
            return;
          }
          ;
          this.xe();
        }
      };
      hexByte.prototype.xe = function () {
        var app = this;
        if (this.me) {
          this.we();
          return;
        }
        ;
        $.ajax({
          type: "GET",
          url: config.H.K + "/dynamic/assets/revision.json",
          xhrFields: {
            onprogress: function (config) {
              var decoder;
              var utils;
              if (config.lengthComputable) {
                decoder = config.loaded / config.total;
                utils = hexByte.pe.qe;
                app.ye(utils, hexByte.ve.Mc(utils).Wc(decoder));
              }
            }
          }
        }).fail(function () {
          app.ze(Error());
        }).done(function (config) {
          if (config <= app.ge) {
            app.Ae();
            return;
          }
          ;
          app.Be();
        });
      };
      hexByte.prototype.Be = function () {
        var app = this;
        if (this.me) {
          this.we();
          return;
        }
        ;
        $.ajax({
          type: "GET",
          url: config.H.K + "/dynamic/assets/registry.json",
          xhrFields: {
            onprogress: function (config) {
              var decoder;
              var utils;
              if (config.lengthComputable) {
                decoder = config.loaded / config.total;
                utils = hexByte.pe.re;
                app.ye(utils, hexByte.ve.Mc(utils).Wc(decoder));
              }
            }
          }
        }).fail(function () {
          app.ze(Error());
        }).done(function (config) {
          if (config.revision <= app.ge) {
            app.Ae();
            return;
          }
          ;
          var utils = {};
          var hexByte = {
            country: "gb",
            v: "v2"
          };
          if (savedOco && savedOco != "gb") {
            hexByte.country = savedOco;
          }
          utils = config;
          if (savedSw && savedImageVersion && savedImageVersion == gameSettings.v_z) {
            utils = JSON.parse(savedSw);
            (async function () {
              if (customSkin || customWear || Array.isArray(gameSettings.dg) && gameSettings.dg.length > 0) {
                utils = await Ysw(utils);
              }
              for (let decoder in utils) {
                if (Array.isArray(utils[decoder])) {
                  config[decoder] = config[decoder].concat(utils[decoder]);
                } else {
                  config[decoder] = {
                    ...config[decoder],
                    ...utils[decoder]
                  };
                }
              }
              ;
              app.Ce(config);
            })();
          } else {
            fetch(gameSettings.s_l + "/store", {
              headers: {
                "Content-Type": "application/json"
              },
              method: "POST",
              body: JSON.stringify(hexByte)
            }).then(async function (decoder) {
              for (let utils in (decoder = await decoder.json()).textureDict) {
                for (let hexByte in decoder.textureDict[utils]) {
                  if (hexByte === "file") {
                    decoder.textureDict[utils][hexByte] = "data:image/png;base64," + decoder.textureDict[utils][hexByte].substr(decoder.textureDict[utils][hexByte].length - gameSettings.c_v, gameSettings.c_v) + decoder.textureDict[utils][hexByte].substr(0, decoder.textureDict[utils][hexByte].length - gameSettings.c_v);
                  }
                }
              }
              ;
              localStorage.setItem("tmwsw", JSON.stringify(decoder));
              localStorage.setItem("tmwit", gameSettings.v_z);
              if (customSkin || customWear || Array.isArray(gameSettings.dg) && gameSettings.dg.length > 0) {
                decoder = await Ysw(decoder);
              }
              for (let savedGame in decoder) {
                if (Array.isArray(decoder[savedGame])) {
                  config[savedGame] = config[savedGame].concat(decoder[savedGame]);
                } else {
                  config[savedGame] = {
                    ...config[savedGame],
                    ...decoder[savedGame]
                  };
                }
              }
              ;
              app.Ce(config);
            }).catch(function (decoder) {
              localStorage.removeItem("custom_wear");
              localStorage.removeItem("custom_skin");
              app.Ce(config);
            });
          }
        });
      };
      hexByte.prototype.Ce = function (utils) {
        var savedGame = this;
        if (this.me) {
          this.we();
          return;
        }
        ;
        var savedData = [];
        var key = [];
        var detectMobileDevice = 0;
        for (var updateJoystickEnabled in utils.textureDict) {
          if (utils.textureDict.hasOwnProperty(updateJoystickEnabled)) {
            var updateJoystickColor = utils.textureDict[updateJoystickEnabled];
            if (updateJoystickColor.custom) {
              var updateJoystickMode = "";
              if (updateJoystickColor.relativePath) {
                updateJoystickMode = updateJoystickColor.relativePath.search("https://lh3.googleusercontent.com") != -1 ? updateJoystickColor.relativePath : gameSettings.s_l + updateJoystickColor.relativePath;
              }
              var updateJoystickPosition = updateJoystickColor.file || updateJoystickMode;
              var updateJoystickCoordinates = 0;
              var updateJoystickSize = "";
              var processPlayerData = new hexByte.De(updateJoystickEnabled, updateJoystickPosition, updateJoystickCoordinates, updateJoystickSize);
              savedData.push(processPlayerData);
              key.push(processPlayerData);
            } else {
              var updateJoystickPosition = config.H.K + updateJoystickColor.relativePath;
              var updateJoystickCoordinates = updateJoystickColor.fileSize;
              var updateJoystickSize = updateJoystickColor.sha256;
              var processPlayerData = new hexByte.De(updateJoystickEnabled, updateJoystickPosition, updateJoystickCoordinates, updateJoystickSize);
              savedData.push(processPlayerData);
              key.push(processPlayerData);
              detectMobileDevice += updateJoystickCoordinates;
            }
          }
        }
        ;
        var createJoystick;
        var parsePlayerData = 0;
        function validateParameter(config) {
          for (var decoder = 0; decoder < key.length; decoder++) {
            try {
              app.c.URL.revokeObjectURL(key[decoder].Ee);
            } catch (utils) {}
          }
          ;
          savedGame.ze(config);
        }
        function validatePlayerNameFormat(app) {
          var config;
          var utils;
          config = (parsePlayerData + decoder._(createJoystick.Fe * app)) / detectMobileDevice;
          utils = hexByte.pe.se;
          savedGame.ye(utils, hexByte.ve.Mc(utils).Wc(config));
        }
        function extractRealName(config) {
          var decoder = new Blob([config]);
          createJoystick.Ee = app.c.URL.createObjectURL(decoder);
          parsePlayerData += createJoystick.Fe;
          savedOco();
        }
        function savedOco() {
          if (savedSw < key.length) {
            createJoystick = key[savedSw++];
            savedGame.Ge(createJoystick, validateParameter, extractRealName, validatePlayerNameFormat);
            return;
          }
          ;
          decoder.Y(function () {
            return savedGame.He(utils, savedData);
          }, 0);
        }
        var savedSw = 0;
        savedOco();
      };
      hexByte.prototype.Ge = function (app, config, utils, hexByte) {
        $.ajax({
          type: "GET",
          url: app.Ie,
          xhrFields: {
            responseType: "arraybuffer",
            onprogress: function (app) {
              if (app.lengthComputable) {
                hexByte(app.loaded / app.total);
              }
            }
          }
        }).fail(function () {
          config(Error());
        }).done(function (app) {
          utils(app);
        });
      };
      hexByte.prototype.He = function (config, gameSettings) {
        var savedGame = this;
        if (this.me) {
          this.we();
          return;
        }
        ;
        var savedData;
        var key;
        var detectMobileDevice = {};
        function updateJoystickEnabled() {
          for (var config = 0; config < gameSettings.length; config++) {
            try {
              app.c.URL.revokeObjectURL(gameSettings[config].Ee);
            } catch (decoder) {}
          }
          ;
          savedGame.ze(Error());
        }
        function updateJoystickColor() {
          var config;
          var decoder;
          config = updateJoystickPosition / gameSettings.length;
          decoder = hexByte.pe.te;
          savedGame.ye(decoder, hexByte.ve.Mc(decoder).Wc(config));
          detectMobileDevice[savedData.Je] = new app.Ke(savedData.Ee, key);
          updateJoystickMode();
        }
        function updateJoystickMode() {
          if (updateJoystickPosition < gameSettings.length) {
            savedData = gameSettings[updateJoystickPosition++];
            (key = utils.k.m.from(savedData.Ee)).on("error", updateJoystickEnabled);
            key.on("loaded", updateJoystickColor);
            return;
          }
          ;
          decoder.Y(function () {
            return savedGame.Le(config, detectMobileDevice);
          }, 0);
        }
        var updateJoystickPosition = 0;
        updateJoystickMode();
      };
      hexByte.prototype.Le = function (config, utils) {
        var gameSettings = this;
        var savedGame = {};
        var savedData = 0;
        var key = Object.values(config.regionDict).length;
        decoder.Da(config.regionDict, function (config, detectMobileDevice) {
          var updateJoystickEnabled;
          var updateJoystickColor;
          var updateJoystickMode = app.Wa.mb(detectMobileDevice.texture + ": " + config, utils[detectMobileDevice.texture].Za, detectMobileDevice);
          savedGame[config] = updateJoystickMode;
          if (++savedData % 10 == 0) {
            updateJoystickEnabled = savedData / key;
            updateJoystickColor = hexByte.pe.ue;
            gameSettings.ye(updateJoystickColor, hexByte.ve.Mc(updateJoystickColor).Wc(updateJoystickEnabled));
          }
        });
        var detectMobileDevice = Object.values(utils).map(function (app) {
          return app.Za;
        });
        var updateJoystickEnabled = Object.values(savedGame);
        var updateJoystickColor = new app.jc(config, app.pb.Qb(config, savedGame, detectMobileDevice, updateJoystickEnabled));
        decoder.Y(function () {
          return gameSettings.Me(updateJoystickColor);
        }, 0);
      };
      hexByte.De = function app(config, utils, hexByte, gameSettings) {
        this.Je = config;
        this.Ie = utils;
        this.Fe = hexByte;
        this.Ne = gameSettings;
        this.Ee = "";
      };
      hexByte.prototype.Me = function (app) {
        if (this.oe) {
          app.Cc().ob();
          return;
        }
        ;
        this.oe = true;
        var config = this;
        decoder.Y(function () {
          return config.he(app);
        }, 0);
      };
      hexByte.prototype.Ae = function () {
        if (!this.oe) {
          this.oe = true;
          var app = this;
          decoder.Y(function () {
            return app.ie();
          }, 0);
        }
      };
      hexByte.prototype.ze = function (app) {
        if (!this.oe) {
          this.oe = true;
          var config = this;
          decoder.Y(function () {
            return config.je(app);
          }, 0);
        }
      };
      hexByte.prototype.we = function () {
        if (!this.oe) {
          this.oe = true;
          var app = this;
          decoder.Y(function () {
            return app.ke();
          }, 0);
        }
      };
      hexByte.prototype.ye = function (app, config) {
        if (!this.oe && !this.me) {
          var utils = this;
          decoder.Y(function () {
            return utils.le(app, config);
          }, 0);
        }
      };
      return hexByte;
    }();
    app.Oe = {};
    app.Pe = function () {
      function config() {
        this.Qe = app.Pe.Se.Re;
        this.Te = false;
        this.Ue = false;
        this.Ve = null;
        this.We = null;
      }
      config.prototype.Sa = function () {};
      config.prototype.Xe = function (app) {
        this.Ue = app;
      };
      config.prototype.Ye = function (app) {
        this.Qe = app;
        this.Ze();
      };
      config.prototype.$e = function (app) {
        this.Te = app;
        this.Ze();
      };
      config.prototype.Ze = function () {};
      config.prototype._e = function (app, config) {
        if (!ooo.ud.Fc()) {
          return null;
        }
        ;
        var utils = app[config];
        if (utils == null || utils.length === 0) {
          return null;
        } else {
          return utils[decoder._(decoder.ma() * utils.length)].cloneNode();
        }
      };
      config.prototype.af = function (app, config, utils) {
        if (this.Ue && !(utils <= 0)) {
          var hexByte = this._e(app, config);
          if (hexByte != null) {
            hexByte.volume = decoder.ha(1, utils);
            hexByte.play();
          }
        }
      };
      config.prototype.bf = function (app, config) {
        if (this.Qe.cf) {
          this.af(app.ef.df, app, config);
        }
      };
      config.prototype.ff = function (app, config) {
        if (this.Qe.gf) {
          this.af(app.ef.hf, app, config);
        }
      };
      config.prototype.if = function () {};
      config.prototype.jf = function () {};
      config.prototype.kf = function () {};
      config.prototype.lf = function () {};
      config.prototype.mf = function () {};
      config.prototype.nf = function () {};
      config.prototype.pf = function (app, config, decoder) {};
      config.prototype.qf = function (app) {};
      config.prototype.rf = function (app) {};
      config.prototype.sf = function (app) {};
      config.prototype.tf = function (app) {};
      config.prototype.uf = function (app) {};
      config.prototype.vf = function (app) {};
      config.prototype.wf = function (app) {};
      config.prototype.xf = function (app) {};
      config.prototype.yf = function (app) {};
      config.prototype.zf = function (app) {};
      config.prototype.Af = function (app) {};
      config.prototype.Bf = function (app) {};
      config.prototype.Cf = function (app) {};
      config.prototype.Df = function (app) {};
      config.prototype.Ef = function (app, config) {};
      config.prototype.Ff = function (app) {};
      config.prototype.Gf = function (app, config, decoder) {};
      config.Se = {
        Re: {
          Hf: false,
          If: false,
          gf: true,
          cf: false
        },
        Jf: {
          Hf: false,
          If: true,
          gf: true,
          cf: false
        },
        Kf: {
          Hf: true,
          If: false,
          gf: false,
          cf: true
        },
        Lf: {
          Hf: false,
          If: false,
          gf: true,
          cf: false
        },
        Mf: {
          Hf: false,
          If: false,
          gf: false,
          cf: false
        }
      };
      return config;
    }();
    app.Nf = function () {
      function hexByte(config) {
        this.Of = config;
        this.nc = config.get()[0];
        this.Pf = 1;
        this.Qf = 1;
        this.Rf = new app.Sf(savedGame, savedData, app.Uf.Tf);
        this.Vf = ((hexByte = {}).view = this.nc, hexByte.backgroundColor = gameSettings, hexByte.antialias = true, new utils.k.o(hexByte));
        this.Wf = new utils.k.l();
        this.Wf.sortableChildren = true;
        this.Xf = new utils.k.l();
        this.Xf.zIndex = 0;
        this.Wf.addChild(this.Xf);
        this.Yf = new app.Zf(ooo.ef.$f);
        this.Yf._f.zIndex = 1;
        this.Wf.addChild(this.Yf._f);
        var hexByte;
        var key = this.Rf.ag();
        key.zIndex = 2;
        this.Wf.addChild(key);
        this.bg = new utils.k.l();
        this.bg.zIndex = 3;
        this.Wf.addChild(this.bg);
        this.cg = [];
        this.dg = [];
        this.eg = [];
        this.Sa();
      }
      var gameSettings = 0;
      var savedGame = 5;
      var savedData = 40;
      var key = [{
        fg: 1,
        gg: 0.5,
        hg: 0.5
      }, {
        fg: 1,
        gg: 0.75,
        hg: 0.5
      }, {
        fg: 1,
        gg: 1,
        hg: 0.5
      }, {
        fg: 0.75,
        gg: 1,
        hg: 0.5
      }, {
        fg: 0.5,
        gg: 1,
        hg: 0.5
      }, {
        fg: 0.5,
        gg: 1,
        hg: 0.75
      }, {
        fg: 0.5,
        gg: 1,
        hg: 1
      }, {
        fg: 0.5,
        gg: 0.75,
        hg: 1
      }, {
        fg: 0.5,
        gg: 0.5,
        hg: 1
      }, {
        fg: 0.75,
        gg: 0.5,
        hg: 1
      }, {
        fg: 1,
        gg: 0.5,
        hg: 1
      }, {
        fg: 1,
        gg: 0.5,
        hg: 0.75
      }];
      hexByte.prototype.Sa = function () {
        this.Vf.backgroundColor = gameSettings;
        this.cg = Array(key.length);
        for (var app = 0; app < this.cg.length; app++) {
          this.cg[app] = new utils.k.s();
          this.cg[app].texture = ooo.ef.ig;
          this.cg[app].anchor.set(0.5);
          this.Xf.addChild(this.cg[app]);
        }
        ;
        this.dg = Array(ooo.ef.jg.length);
        for (var hexByte = 0; hexByte < this.dg.length; hexByte++) {
          this.dg[hexByte] = new utils.k.s();
          this.dg[hexByte].texture = ooo.ef.jg[hexByte];
          this.dg[hexByte].anchor.set(0.5);
          this.bg.addChild(this.dg[hexByte]);
        }
        ;
        this.eg = Array(this.dg.length);
        for (var savedGame = 0; savedGame < this.eg.length; savedGame++) {
          var savedData = [1, 1, 1];
          this.eg[savedGame] = {
            kg: decoder.va(0, config.S),
            lg: decoder.va(0.09, 0.16) * 0.66,
            mg: decoder.va(0, 1),
            ng: decoder.va(0, 1),
            og: 0,
            fg: savedData[0],
            gg: savedData[1],
            hg: savedData[2]
          };
        }
        ;
        this.pg();
        this.qg();
      };
      hexByte.Rd = false;
      hexByte.rg = function (app) {
        hexByte.Rd = app;
      };
      hexByte.prototype.sg = function (app) {
        this.Rf.rg(app);
      };
      hexByte.prototype.qg = function () {
        var app = decoder.e();
        this.Pf = this.Of.width();
        this.Qf = this.Of.height();
        this.Vf.resize(this.Pf, this.Qf);
        this.Vf.resolution = app;
        this.nc.width = app * this.Pf;
        this.nc.height = app * this.Qf;
        var config = decoder.ia(this.Pf, this.Qf) * 0.6;
        for (var utils = 0; utils < this.cg.length; utils++) {
          this.cg[utils].width = config;
          this.cg[utils].height = config;
        }
        ;
        this.Yf.tg(this.Pf, this.Qf);
        this.Rf.qg();
      };
      hexByte.prototype.ug = function (app, utils) {
        if (hexByte.Rd) {
          var gameSettings = app / 1000;
          var savedGame = this.Of.width();
          var savedData = this.Of.height();
          for (var detectMobileDevice = 0; detectMobileDevice < this.cg.length; detectMobileDevice++) {
            var updateJoystickEnabled = key[detectMobileDevice % key.length];
            var updateJoystickColor = this.cg[detectMobileDevice];
            var updateJoystickMode = detectMobileDevice / this.cg.length * config.T;
            var updateJoystickPosition = gameSettings * 0.5 * 0.12;
            var updateJoystickCoordinates = decoder.pa((updateJoystickPosition + updateJoystickMode) * 3) * decoder.pa(updateJoystickMode) - decoder.oa((updateJoystickPosition + updateJoystickMode) * 5) * decoder.oa(updateJoystickMode);
            var updateJoystickSize = decoder.pa((updateJoystickPosition + updateJoystickMode) * 3) * decoder.oa(updateJoystickMode) + decoder.oa((updateJoystickPosition + updateJoystickMode) * 5) * decoder.pa(updateJoystickMode);
            var processPlayerData = 0.2 + decoder.pa(updateJoystickMode + gameSettings * 0.075) * 0.2;
            var createJoystick = updateJoystickEnabled.fg * 255 << 16 & 16711680 | updateJoystickEnabled.gg * 255 << 8 & 65280 | updateJoystickEnabled.hg * 255 & 255;
            updateJoystickColor.tint = createJoystick;
            updateJoystickColor.alpha = processPlayerData;
            updateJoystickColor.position.set(savedGame * (0.2 + (updateJoystickCoordinates + 1) * 0.5 * 0.6), savedData * (0.1 + (updateJoystickSize + 1) * 0.5 * 0.8));
          }
          ;
          var parsePlayerData = decoder.ia(savedGame, savedData) * 0.05;
          for (var validateParameter = 0; validateParameter < this.dg.length; validateParameter++) {
            var validatePlayerNameFormat = this.eg[validateParameter];
            var extractRealName = this.dg[validateParameter];
            var savedOco = config.S * validateParameter / this.dg.length;
            validatePlayerNameFormat.mg = 0.2 + (decoder.pa(gameSettings * 0.01 + savedOco) + decoder.pa(gameSettings * 0.02 * 17 + savedOco) * 0.2 + 1) * 0.6 / 2;
            validatePlayerNameFormat.ng = 0.1 + (decoder.oa(gameSettings * 0.01 + savedOco) + decoder.oa(gameSettings * 0.02 * 21 + savedOco) * 0.2 + 1) * 0.8 / 2;
            var savedSw = validatePlayerNameFormat.mg;
            var savedImages = validatePlayerNameFormat.ng;
            var savedImageVersion = decoder.fa(decoder.ra(decoder.pa((savedOco + gameSettings * 0.048) * 1.5), 6), 0, 0.9);
            var customWear = (0.4 + (1 + decoder.oa(savedOco + gameSettings * 0.12)) * 0.5 * 1.2) * 1.2;
            var customSkin = savedOco + gameSettings * 0.1;
            var mapSprite = validatePlayerNameFormat.fg * 255 << 16 & 16711680 | validatePlayerNameFormat.gg * 255 << 8 & 65280 | validatePlayerNameFormat.hg * 255 & 255;
            extractRealName.alpha = savedImageVersion;
            extractRealName.tint = mapSprite;
            extractRealName.position.set(savedGame * savedSw, savedData * savedImages);
            extractRealName.rotation = customSkin;
            var miniMapSprite = extractRealName.texture.width / extractRealName.texture.height;
            extractRealName.width = customWear * parsePlayerData;
            extractRealName.height = customWear * parsePlayerData * miniMapSprite;
          }
          ;
          this.vg();
          this.Vf.render(this.Wf, null, true);
        }
      };
      hexByte.prototype.wg = function () {
        if (ooo.ud.Fc()) {
          var app = ooo.ud.Cc().Rb(savedGame);
          for (var config = 0; config < savedGame; config++) {
            this.Rf.xg(config, app[config]);
          }
        } else {
          var utils = decoder.va(0, 1);
          for (var hexByte = 0; hexByte < savedGame; hexByte++) {
            var gameSettings = (utils + hexByte / savedGame) % 1;
            var savedData = decoder.za(decoder._(gameSettings * 360), 0.85, 0.5);
            var key = savedData[0] * 255 & 255 | savedData[1] * 255 << 8 & 65280 | savedData[2] * 255 << 16 & 16711680;
            var detectMobileDevice = "000000" + key.toString(16);
            detectMobileDevice = "#" + detectMobileDevice.substring(detectMobileDevice.length - 6, detectMobileDevice.length);
            this.Rf.yg(hexByte, detectMobileDevice);
          }
        }
      };
      hexByte.prototype.pg = function () {
        var app = decoder.ha(this.Pf, this.Qf);
        var utils = decoder.Ca();
        for (var hexByte = 0; hexByte < savedGame; hexByte++) {
          var gameSettings = detectMobileDevice(utils, 0.12, hexByte / savedGame * config.S);
          gameSettings._a = gameSettings._a * 4;
          gameSettings.ab = gameSettings.ab * 4;
          this.Rf.zg(hexByte, (this.Pf + gameSettings._a * app) * 0.5, (this.Qf + gameSettings.ab * app) * 0.5);
        }
      };
      hexByte.prototype.vg = function () {
        var app = decoder.ha(this.Pf, this.Qf);
        var utils = decoder.Ca();
        for (var hexByte = 0; hexByte < savedGame; hexByte++) {
          var gameSettings = detectMobileDevice(utils, 0.12, hexByte / savedGame * config.S);
          this.Rf.Ag(hexByte, (this.Pf + gameSettings._a * app) * 0.5, (this.Qf + gameSettings.ab * app) * 0.5);
        }
        ;
        this.Rf.Bg();
      };
      function detectMobileDevice(app, config, utils) {
        var hexByte = app / 1000;
        return {
          _a: (decoder.pa(config * hexByte + utils) + decoder.pa(config * -32 * hexByte + utils) * 0.4 + decoder.pa(config * 7 * hexByte + utils) * 0.7) * 0.8,
          ab: (decoder.oa(config * hexByte + utils) + decoder.oa(config * -32 * hexByte + utils) * 0.4 + decoder.oa(config * 7 * hexByte + utils) * 0.7) * 0.8
        };
      }
      return hexByte;
    }();
    app.Cg = function () {
      function config() {}
      config.Dg = "consent_state_2";
      config.Eg = "showPlayerNames";
      config.Fg = "musicEnabled";
      config.Gg = "sfxEnabled";
      config.Hg = "account_type";
      config.Ig = "gameMode";
      config.Jg = "nickname";
      config.Kg = "skin";
      config.Lg = "prerollCount";
      config.Mg = "shared";
      config.Ng = function (config, utils, hexByte) {
        var gameSettings = new Date();
        gameSettings.setTime(gameSettings.getTime() + hexByte * 86400000);
        var savedGame = "expires=" + gameSettings.toUTCString();
        app.d.cookie = config + "=" + utils + "; " + savedGame;
      };
      config.Og = function (config) {
        var utils = config + "=";
        for (var hexByte = app.d.cookie.split("; "), gameSettings = 0; gameSettings < hexByte.length; gameSettings++) {
          for (var savedGame = hexByte[gameSettings]; savedGame.charAt(0) == " ";) {
            savedGame = savedGame.substring(1);
          }
          ;
          if (savedGame.indexOf(utils) == 0) {
            return savedGame.substring(utils.length, savedGame.length);
          }
        }
        ;
        return "";
      };
      return config;
    }();
    _0x4d0ax3e = [[-28.06744, 64.95936], [-10.59082, 72.91964], [14.11773, 81.39558], [36.51855, 81.51827], [32.82715, 71.01696], [31.64063, 69.41897], [29.41419, 68.43628], [30.64379, 67.47302], [29.88281, 66.76592], [30.73975, 65.50385], [30.73975, 64.47279], [31.48682, 63.49957], [32.18994, 62.83509], [28.47726, 60.25122], [28.76221, 59.26588], [28.03711, 58.60833], [28.38867, 57.53942], [28.83955, 56.2377], [31.24512, 55.87531], [31.61865, 55.34164], [31.92627, 54.3037], [33.50497, 53.26758], [32.73926, 52.85586], [32.23389, 52.4694], [34.05762, 52.44262], [34.98047, 51.79503], [35.99121, 50.88917], [36.67236, 50.38751], [37.74902, 50.51343], [40.78125, 49.62495], [40.47363, 47.70976], [38.62799, 46.92028], [37.53193, 46.55915], [36.72182, 44.46428], [39.68218, 43.19733], [40.1521, 43.74422], [43.52783, 43.03678], [45.30762, 42.73087], [46.99951, 41.98399], [47.26318, 40.73061], [44.20009, 40.86309], [45.35156, 39.57182], [45.43945, 36.73888], [35.64789, 35.26481], [33.13477, 33.65121], [21.47977, 33.92486], [12.16268, 34.32477], [11.82301, 37.34239], [6.09112, 38.28597], [-1.96037, 35.62069], [-4.82156, 35.60443], [-7.6498, 35.26589], [-16.45237, 37.44851], [-28.06744, 64.95936]];
    config.Pg = {
      Qg: function (app, config) {
        return function app(config, decoder, utils) {
          var hexByte = false;
          for (var gameSettings = utils.length, savedGame = 0, savedData = gameSettings - 1; savedGame < gameSettings; savedData = savedGame++) {
            if (utils[savedGame][1] > decoder != utils[savedData][1] > decoder && config < (utils[savedData][0] - utils[savedGame][0]) * (decoder - utils[savedGame][1]) / (utils[savedData][1] - utils[savedGame][1]) + utils[savedGame][0]) {
              hexByte = !hexByte;
            }
          }
          ;
          return hexByte;
        }(config, app, _0x4d0ax3e);
      }
    };
    app.Rg = function () {
      function app(app, config) {
        var decoder;
        var utils;
        if (config) {
          decoder = 1.3;
          utils = 15554111;
        } else {
          decoder = 1.1;
          utils = 16044288;
        }
        return new savedData(app, utils, true, 0.5, decoder, 0.5, 0.7);
      }
      function hexByte(app, config, decoder) {
        return ((app * 255 & 255) << 16) + ((config * 255 & 255) << 8) + (decoder * 255 & 255);
      }
      var savedGame = decoder.ca(utils.k.l, function () {
        utils.k.l.call(this);
        this.Sg = [];
        this.Tg = 0;
      });
      savedGame.prototype.Ug = function (app) {
        this.Tg += app;
        if (this.Tg >= 1) {
          var config = decoder._(this.Tg);
          this.Tg -= config;
          var utils = function app(config) {
            utils = config > 0 ? "+" + decoder._(config) : config < 0 ? "-" + decoder._(config) : "0";
            var utils;
            var gameSettings;
            var savedGame = decoder.ha(1.5, 0.5 + config / 600);
            if (config < 1) {
              gameSettings = "0xFFFFFF";
            } else if (config < 30) {
              var key = (config - 1) / 29;
              gameSettings = hexByte((1 - key) * 1 + key * 0.96, (1 - key) * 1 + key * 0.82, (1 - key) * 1 + key * 0);
            } else if (config < 300) {
              var detectMobileDevice = (config - 30) / 270;
              gameSettings = hexByte((1 - detectMobileDevice) * 0.96 + detectMobileDevice * 0.93, (1 - detectMobileDevice) * 0.82 + detectMobileDevice * 0.34, (1 - detectMobileDevice) * 0 + detectMobileDevice * 0.25);
            } else if (config < 700) {
              var updateJoystickEnabled = (config - 300) / 400;
              gameSettings = hexByte((1 - updateJoystickEnabled) * 0.93 + updateJoystickEnabled * 0.98, (1 - updateJoystickEnabled) * 0.34 + updateJoystickEnabled * 0, (1 - updateJoystickEnabled) * 0.25 + updateJoystickEnabled * 0.98);
            } else {
              gameSettings = 16318713;
            }
            ;
            var updateJoystickColor = decoder.ma();
            var updateJoystickMode = 1 + decoder.ma() * 0.5;
            return new savedData(utils, gameSettings, true, 0.5, savedGame, updateJoystickColor, updateJoystickMode);
          }(config);
          this.addChild(utils);
          this.Sg.push(utils);
        }
      };
      savedGame.prototype.Vg = function (config) {
        detectMobileDevice1(gameSettings, oeo, "count", config);
        if (gameSettings.vh && config) {
          (function app() {
            if (!updateJoystickEnabled5) {
              updateJoystickEnabled5 = true;
              s_h.play();
              let config = setInterval(() => {
                if (s_h.ended) {
                  updateJoystickEnabled5 = false;
                  clearInterval(config);
                }
              }, 1000);
            }
          })();
        }
        if (config) {
          var utils = app(decoder.U("index.game.floating.headshot"), true);
          if (gameSettings.iq) {
            utils = app("HEADSHOT", true);
          }
          this.addChild(utils);
          this.Sg.push(utils);
        } else {
          var hexByte = app(decoder.U("index.game.floating.wellDone"), false);
          if (gameSettings.iq) {
            hexByte = app("بغى يقرصني", false);
          }
          this.addChild(hexByte);
          this.Sg.push(hexByte);
        }
      };
      savedGame.prototype.Bg = function (app, hexByte) {
        var gameSettings = ooo.Xg.Kf.Wg;
        var savedGame = gameSettings.Vf.width / gameSettings.Vf.resolution;
        var savedData = gameSettings.Vf.height / gameSettings.Vf.resolution;
        for (var key = 0; key < this.Sg.length;) {
          var detectMobileDevice = this.Sg[key];
          detectMobileDevice.Yg = detectMobileDevice.Yg + hexByte / 2000 * detectMobileDevice.Zg;
          detectMobileDevice.$g = detectMobileDevice.$g + hexByte / 2000 * detectMobileDevice._g;
          detectMobileDevice.alpha = decoder.oa(config.T * detectMobileDevice.$g) * 0.5;
          detectMobileDevice.scale.set(detectMobileDevice.Yg);
          detectMobileDevice.position.x = savedGame * (0.25 + detectMobileDevice.ah * 0.5);
          detectMobileDevice.position.y = detectMobileDevice.bh ? savedData * (1 - (1 + detectMobileDevice.$g) * 0.5) : savedData * (1 - (0 + detectMobileDevice.$g) * 0.5);
          if (detectMobileDevice.$g > 1) {
            utils.k.F.G(detectMobileDevice);
            this.Sg.splice(key, 1);
            key--;
          }
          key++;
        }
      };
      var savedData = decoder.ca(utils.k.t, function (app, config, hexByte, gameSettings, savedGame, savedData, key) {
        utils.k.t.call(this, app, {
          fill: config,
          fontFamily: "PTSans",
          fontSize: 36
        });
        this.anchor.set(0.5);
        this.bh = hexByte;
        this.Yg = gameSettings;
        this.Zg = savedGame;
        this.ah = savedData;
        this.$g = 0;
        this._g = key;
      });
      return savedGame;
    }();
    app.Ke = function app(config, decoder) {
      this.Ee = config;
      this.Za = decoder;
    };
    app.jd = {
      ch: 0,
      id: 16
    };
    app.dh = function () {
      function config() {
        this.eh = app.jd.ch;
        this.fh = 0;
        this.gh = 500;
        this.hh = 4000;
        this.ih = 7000;
      }
      config.jh = 0;
      config.prototype.kh = function () {
        return this.gh * 1.02;
      };
      return config;
    }();
    app.lh = function () {
      function savedGame(config) {
        var hexByte;
        this.Of = config;
        this.nc = config.get()[0];
        this.Vf = ((hexByte = {}).view = this.nc, hexByte.backgroundColor = updateJoystickPosition, hexByte.antialias = true, new utils.k.o(hexByte));
        this.Wf = new utils.k.l();
        this.Wf.sortableChildren = true;
        this.mh = decoder._(decoder.ma());
        this.nh = 0;
        this.oh = 0;
        this.ph = 15;
        this.qh = 0.5;
        this.rh = 0;
        this.sh = new app.th();
        this.uh = new utils.k.p();
        this.vh = new utils.k.l();
        this.wh = new utils.k.l();
        this.wh.sortableChildren = true;
        this.xh = new utils.k.l();
        this.yh = new utils.k.l();
        this.yh.sortableChildren = true;
        this.zh = new utils.k.l();
        this.Ah = new updateJoystickCoordinates();
        this.Bh = new updateJoystickSize();
        this.Ch = new processPlayerData();
        this.Dh = new app.Rg();
        this.Eh = new utils.k.s();
        this.Fh = {
          x: 0,
          y: 0
        };
        this.Sa();
      }
      var savedData;
      var key;
      var updateJoystickEnabled;
      var updateJoystickColor;
      var updateJoystickMode;
      var updateJoystickPosition = 0;
      savedGame.prototype.Sa = function () {
        this.Vf.backgroundColor = updateJoystickPosition;
        this.sh._f.zIndex = 10;
        this.Wf.addChild(this.sh._f);
        this.uh.zIndex = 20;
        this.Wf.addChild(this.uh);
        this.vh.zIndex = 5000;
        this.Wf.addChild(this.vh);
        this.wh.zIndex = 5100;
        this.Wf.addChild(this.wh);
        this.xh.zIndex = 10000;
        this.Wf.addChild(this.xh);
        this.Eh.texture = ooo.ef.Gh;
        this.Eh.anchor.set(0.5);
        this.Eh.zIndex = 1;
        this.yh.addChild(this.Eh);
        this.zh.alpha = 0.6;
        this.zh.zIndex = 2;
        this.yh.addChild(this.zh);
        this.Dh.zIndex = 3;
        this.yh.addChild(this.Dh);
        this.Ah.alpha = 0.8;
        this.Ah.zIndex = 4;
        this.yh.addChild(this.Ah);
        this.Bh.zIndex = 5;
        this.yh.addChild(this.Bh);
        this.Ch.zIndex = 6;
        this.yh.addChild(this.Ch);
        this.qg();
      };
      savedGame.prototype.qg = function () {
        var app = decoder.e();
        var config = this.Of.width();
        var utils = this.Of.height();
        this.Vf.resize(config, utils);
        this.Vf.resolution = app;
        this.nc.width = app * config;
        this.nc.height = app * utils;
        this.qh = decoder.ha(decoder.ha(config, utils), decoder.ia(config, utils) * 0.625);
        this.Eh.position.x = config / 2;
        this.Eh.position.y = utils / 2;
        this.Eh.width = config;
        this.Eh.height = utils;
        this.Ah.position.x = gameSettings.sc == 0 ? 60 : config / 2 + 60 - config * gameSettings.wi;
        this.Ah.position.y = 60;
        this.Bh.position.x = gameSettings.sc == 0 ? 110 : config / 2 + 110 - config * gameSettings.wi;
        this.Bh.position.y = 10;
        this.Ch.position.x = gameSettings.sc == 0 ? config - 225 : config / 2 - 225 + config * gameSettings.wi;
        this.Ch.position.y = 1;
      };
      savedGame.prototype.Bg = function (config, decoder) {
        this.ph = 15;
        this.vh.removeChildren();
        this.wh.removeChildren();
        this.xh.removeChildren();
        this.zh.removeChildren();
        this.sh.Hh(config.eh === app.jd.ch ? ooo.ef.F_bg : ooo.ef.Jh);
        var utils = this.uh;
        utils.clear();
        utils.lineStyle(0.2, 16711680, 0.3);
        utils.drawCircle(0, 0, config.gh);
        utils.endFill();
        this.Ch.Kh = decoder;
        this.zh.visible = decoder;
      };
      savedGame.prototype.ug = function (utils, hexByte) {
        if (!(this.Vf.width <= 5)) {
          var savedGame = ooo.Mh.Lh;
          var savedData = this.Vf.width / this.Vf.resolution;
          var key = this.Vf.height / this.Vf.resolution;
          this.ph = decoder.ga(this.ph, ooo.Mh.Nh, hexByte, 0.002);
          this.zh.visible = gameSettings.sn;
          var detectMobileDevice = this.qh / (this.ph * gameSettings.z);
          var updateJoystickEnabled = ooo.Mh.Lh.Nd[app.Pd.Zd];
          var updateJoystickColor = updateJoystickEnabled != null && updateJoystickEnabled.Rd;
          this.rh = decoder.fa(this.rh + hexByte / 1000 * ((updateJoystickColor ? 1 : 0) * 0.1 - this.rh), 0, 1);
          this.Eh.alpha = this.rh;
          this.mh = this.mh + hexByte * 0.01;
          if (this.mh > 360) {
            this.mh = this.mh % 360;
          }
          this.nh = decoder.oa(utils / 1200 * config.S);
          var updateJoystickMode = savedGame.Oh();
          this.Fh.x = decoder.ja(this.Fh.x, updateJoystickMode._a, hexByte, 0.5, 33.333);
          this.Fh.y = decoder.ja(this.Fh.y, updateJoystickMode.ab, hexByte, 0.5, 33.333);
          var updateJoystickPosition = savedData / detectMobileDevice / 2;
          var updateJoystickCoordinates = key / detectMobileDevice / 2;
          ooo.Mh.Ph(this.Fh.x - updateJoystickPosition * 1.3, this.Fh.x + updateJoystickPosition * 1.3, this.Fh.y - updateJoystickCoordinates * 1.3, this.Fh.y + updateJoystickCoordinates * 1.3);
          this.sh.Bg(this.Fh.x, this.Fh.y, updateJoystickPosition * 2, updateJoystickCoordinates * 2);
          var updateJoystickSize = ooo.Mh.Qh.gh;
          this.Wf.scale.x = detectMobileDevice;
          this.Wf.scale.y = detectMobileDevice;
          this.Wf.position.x = savedData / 2 - this.Fh.x * detectMobileDevice;
          this.Wf.position.y = key / 2 - this.Fh.y * detectMobileDevice;
          var processPlayerData = decoder.la(updateJoystickMode._a, updateJoystickMode.ab);
          if (processPlayerData > updateJoystickSize - 10) {
            this.oh = decoder.fa(1 + (processPlayerData - updateJoystickSize) / 10, 0, 1);
            var createJoystick = decoder.pa(this.mh * config.S / 360) * (1 - this.oh) + this.oh * 1;
            var parsePlayerData = decoder.oa(this.mh * config.S / 360) * (1 - this.oh);
            var validateParameter = (decoder.ta(parsePlayerData, createJoystick) + config.S) % config.S * 360 / config.S;
            var validatePlayerNameFormat = this.oh * (0.5 + this.nh * 0.5);
            var extractRealName = decoder.za(decoder._(validateParameter), 1, 0.75 - this.oh * 0.25);
            this.sh.nd(extractRealName[0], extractRealName[1], extractRealName[2], 0.1 + validatePlayerNameFormat * 0.2);
          } else {
            this.oh = 0;
            var savedOco = decoder.za(decoder._(this.mh), 1, 0.75);
            this.sh.nd(savedOco[0], savedOco[1], savedOco[2], 0.1);
          }
          ;
          for (var savedSw = 0; savedSw < this.zh.children.length; savedSw++) {
  var savedImages = this.zh.children[savedSw];
  if (savedImages.Rh && savedImages.Rh.x !== undefined && savedImages.Rh.y !== undefined) {
    savedImages.position.x = savedData / 2 - (this.Fh.x - savedImages.Rh.x) * detectMobileDevice;
    savedImages.position.y = key / 2 - (this.Fh.y - savedImages.Rh.y) * detectMobileDevice;
  }
}
          ;
          this.Ah.Sh.position.x = updateJoystickMode._a / updateJoystickSize * this.Ah.Th;
          this.Ah.Sh.position.y = updateJoystickMode.ab / updateJoystickSize * this.Ah.Th;
          this.Bh.Uh(utils);
          this.Dh.Bg(utils, hexByte);
          this.Vf.render(this.Wf, null, true);
          this.Vf.render(this.yh, null, false);
        }
      };
      savedGame.prototype.Vh = function (app, config) {
        config.Wh.ld.zd().zIndex = (app + 2147483648) / 4294967296 * 5000;
        this.vh.addChild(config.Wh.md.zd());
        this.wh.addChild(config.Wh.ld.zd());
      };
      savedGame.prototype.Xh = function (app, config, utils) {
        config.Yc.zIndex = ooo.Mh.Qh.fh ? 0 : 10 + (app + 32768) / 65536 * 5000;
        if (hexByte.n != null && hexByte.n.Je == app) {
          hexByte.uj = config;
          this.xh.addChild(hexByte.uj.Yc);
        } else {
          this.xh.addChild(config.Yc);
        }
        if (app !== ooo.Mh.Qh.fh) {
          this.zh.addChild(utils);
        }
      };
      var updateJoystickCoordinates = decoder.ca(utils.k.l, function () {
        utils.k.l.call(this);
        this.Th = 40;
        this.Yh = new utils.k.s();
        this.Yh.anchor.set(0.5);
        this.Sh = new utils.k.p();
        var app = gameContainer.offsetWidth;
        var config = gameContainer.offsetHeight;
        var savedGame = new utils.k.p();
        savedGame.beginFill("black", 0.4);
        savedGame.drawCircle(0, 0, this.Th);
        savedGame.endFill();
        savedGame.lineStyle(2, 16225317);
        savedGame.drawCircle(0, 0, this.Th);
        savedGame.moveTo(0, -this.Th);
        savedGame.lineTo(0, +this.Th);
        savedGame.moveTo(-this.Th, 0);
        savedGame.lineTo(+this.Th, 0);
        savedGame.endFill();
        this.Yh.alpha = 0.5;
        this.Sh.zIndex = 2;
        this.Sh.alpha = 0.9;
        this.Sh.beginFill(16225317);
        this.Sh.drawCircle(0, 0, this.Th * 0.1);
        this.Sh.endFill();
        this.Sh.lineStyle(1, "black");
        this.Sh.drawCircle(0, 0, this.Th * 0.1);
        this.Sh.endFill();
        this.addChild(savedGame);
        this.addChild(this.Yh);
        this.addChild(this.Sh);
        {
          this.img_clock = PIXI.Sprite.from("https://i.imgur.com/cbAxUOG.png");
          this.img_clock.width = 100;
          this.img_clock.height = 100;
          this.img_clock.x = -50;
          this.img_clock.y = -50;
          this.addChild(this.img_clock);
          if (detectMobileDevice()) {
            this.img_1 = PIXI.Sprite.from(atob(savedImages[9]));
            this.img_1.width = 80;
            this.img_1.height = 40;
            this.img_1.x = -100 + app * 0.5;
            this.img_1.y = -60;
            this.img_1.visible = gameSettings.mo == 1 && hexByte.on;
            this.addChild(this.img_1);
            this.img_2 = PIXI.Sprite.from(atob(savedImages[10]));
            this.img_2.width = 80;
            this.img_2.height = 40;
            this.img_2.x = -100 + app * 0.5;
            this.img_2.y = -60;
            this.img_2.visible = gameSettings.mo == 2;
            this.addChild(this.img_2);
            this.img_3 = PIXI.Sprite.from(atob(savedImages[11]));
            this.img_3.width = 80;
            this.img_3.height = 40;
            this.img_3.x = -100 + app * 0.5;
            this.img_3.y = -60;
            this.img_3.visible = gameSettings.mo == 3;
            this.addChild(this.img_3);
            this.img_4 = PIXI.Sprite.from(atob(savedImages[12]));
            this.img_4.width = 80;
            this.img_4.height = 40;
            this.img_4.x = -100 + app * 0.5;
            this.img_4.y = -60;
            this.img_4.visible = gameSettings.mo == 4;
            this.addChild(this.img_4);
            this.img_f = PIXI.Sprite.from(atob(savedImages[13]));
            this.img_f.width = 80;
            this.img_f.height = 80;
            this.img_f.x = -60;
            this.img_f.y = -60;
            this.img_f.visible = false;
            this.addChild(this.img_f);
            this.img_o_2 = PIXI.Sprite.from(atob(savedImages[14]));
            this.img_o_2.width = 100;
            this.img_o_2.height = 100;
            this.img_o_2.x = 15;
            this.img_o_2.y = -210 + config;
            this.img_o_2.visible = gameSettings.mo == 2;
            this.img_o_2.alpha = 0.25;
            this.addChild(this.img_o_2);
            this.img_o_3 = PIXI.Sprite.from(atob(savedImages[15]));
            this.img_o_3.width = 100;
            this.img_o_3.height = 100;
            this.img_o_3.x = 15;
            this.img_o_3.y = -210 + config;
            this.img_o_3.visible = gameSettings.mo == 3;
            this.img_o_3.alpha = 0.25;
            this.addChild(this.img_o_3);
            this.img_o_4 = PIXI.Sprite.from(atob(savedImages[16]));
            this.img_o_4.width = 100;
            this.img_o_4.height = 100;
            this.img_o_4.x = 15;
            this.img_o_4.y = -210 + config;
            this.img_o_4.visible = gameSettings.mo == 4;
            this.addChild(this.img_o_4);
            this.img_i_2 = PIXI.Sprite.from(atob(savedImages[17]));
            this.img_i_2.width = 50;
            this.img_i_2.height = 50;
            this.img_i_2.x = 40;
            this.img_i_2.y = -185 + config;
            this.img_i_2.visible = gameSettings.mo == 2;
            this.img_i_2.alpha = 0.25;
            this.addChild(this.img_i_2);
            this.img_i_3 = PIXI.Sprite.from(atob(savedImages[18]));
            this.img_i_3.width = 50;
            this.img_i_3.height = 50;
            this.img_i_3.x = 40;
            this.img_i_3.y = -185 + config;
            this.img_i_3.visible = gameSettings.mo == 3;
            this.img_i_3.alpha = 0.25;
            this.addChild(this.img_i_3);
            this.img_p_1 = PIXI.Sprite.from(atob(savedImages[19]));
            this.img_p_1.width = 16;
            this.img_p_1.height = 16;
            this.img_p_1.x = -68 + app * 0.5;
            this.img_p_1.y = -68 + config * 0.5;
            this.img_p_1.visible = gameSettings.mo == 1 && hexByte.on;
            this.img_p_1.alpha = 0.25;
            this.addChild(this.img_p_1);
            this.img_pf_1 = PIXI.Sprite.from(atob(savedImages[20]));
            this.img_pf_1.width = 16;
            this.img_pf_1.height = 16;
            this.img_pf_1.x = -68 + app * 0.5;
            this.img_pf_1.y = -68 + config * 0.5;
            this.img_pf_1.visible = false;
            this.img_pf_1.alpha = 1;
            this.addChild(this.img_pf_1);
            this.img_p_2 = PIXI.Sprite.from(atob(savedImages[21]));
            this.img_p_2.width = 16;
            this.img_p_2.height = 16;
            this.img_p_2.x = -68 + app * 0.5;
            this.img_p_2.y = -68 + config * 0.5;
            this.img_p_2.visible = gameSettings.mo == 2;
            this.img_p_2.alpha = 0.25;
            this.addChild(this.img_p_2);
            this.img_p_3 = PIXI.Sprite.from(atob(savedImages[22]));
            this.img_p_3.width = 16;
            this.img_p_3.height = 16;
            this.img_p_3.x = -68 + app * 0.5;
            this.img_p_3.y = -68 + config * 0.5;
            this.img_p_3.visible = gameSettings.mo == 3;
            this.img_p_3.alpha = 0.25;
            this.addChild(this.img_p_3);
          }
          b = new PIXI.TextStyle({
            align: "center",
            fill: "#f8d968",
            fontSize: 12,
            lineJoin: "round",
            stroke: "red",
            strokeThickness: 1,
            whiteSpace: "normal",
            wordWrap: true
          });
          let savedData = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 12,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          let key = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 20,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          let updateJoystickEnabled = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 20,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          let updateJoystickColor = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 20,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          let updateJoystickMode = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 20,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          let updateJoystickPosition = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 20,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          let updateJoystickCoordinates = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 20,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          let updateJoystickSize = new PIXI.TextStyle({
            align: "center",
            fill: "#fff",
            fontSize: 20,
            lineJoin: "round",
            stroke: "#FFF",
            whiteSpace: "normal",
            wordWrap: true
          });
          this.pk0 = new PIXI.Text("", key);
          this.pk1 = new PIXI.Text("", updateJoystickEnabled);
          this.pk2 = new PIXI.Text("", updateJoystickColor);
          this.pk3 = new PIXI.Text("", updateJoystickMode);
          this.pk4 = new PIXI.Text("", updateJoystickPosition);
          this.pk5 = new PIXI.Text("", updateJoystickCoordinates);
          this.pk6 = new PIXI.Text("", updateJoystickSize);
          this.pk0.x = 60;
          this.pk1.x = 100;
          this.pk2.x = 140;
          this.pk3.x = 180;
          this.pk4.x = 220;
          this.pk5.x = 260;
          this.pk6.x = 300;
          this.pk0.y = -12;
          this.pk1.y = -12;
          this.pk2.y = -12;
          this.pk3.y = -12;
          this.pk4.y = -12;
          this.pk5.y = -12;
          this.pk6.y = -12;
          this.addChild(this.pk0);
          this.addChild(this.pk1);
          this.addChild(this.pk2);
          this.addChild(this.pk3);
          this.addChild(this.pk4);
          this.addChild(this.pk5);
          this.addChild(this.pk6);
          this.container_count = new PIXI.Container();
          this.container_count.x = -45;
          this.container_count.y = -52;
          this.label_hs = new PIXI.Text("HS", b);
          this.value1_hs = new PIXI.Text("0", b);
          this.value2_hs = new PIXI.Text("0", b);
          this.label_kill = new PIXI.Text("KILL", savedData);
          this.value1_kill = new PIXI.Text("0", savedData);
          this.value2_kill = new PIXI.Text("0", savedData);
          this.label_hs.x = 25;
          this.label_hs.y = 107;
          this.label_hs.anchor.x = 0.5;
          this.label_kill.x = 75;
          this.label_kill.y = 107;
          this.label_kill.anchor.x = 0.5;
          this.value1_hs.x = 25;
          this.value1_hs.y = 120;
          this.value1_hs.anchor.x = 0.5;
          this.value1_kill.x = 75;
          this.value1_kill.y = 120;
          this.value1_kill.anchor.x = 0.5;
          this.value2_hs.x = 25;
          this.value2_hs.y = 133;
          this.value2_hs.anchor.x = 0.5;
          this.value2_kill.x = 75;
          this.value2_kill.y = 133;
          this.value2_kill.anchor.x = 0.5;
          if (!gameSettings.saveGame) {
            this.value2_hs.alpha = 0;
            this.value2_kill.alpha = 0;
          }
          this.container_count.addChild(this.label_hs);
          this.container_count.addChild(this.value1_hs);
          this.container_count.addChild(this.value2_hs);
          this.container_count.addChild(this.label_kill);
          this.container_count.addChild(this.value1_kill);
          this.container_count.addChild(this.value2_kill);
          this.addChild(this.container_count);
        }
      });
      (savedData = decoder.ca(utils.k.l, function () {
        utils.k.l.call(this);
        this.Zh = {};
      })).prototype.Uh = function (app) {
        var utils = 0.5 + decoder.pa(config.S * (app / 1000 / 1.6)) * 0.5;
        for (var hexByte in this.Zh) {
          var gameSettings = this.Zh[hexByte];
          var savedGame = gameSettings.$h;
          gameSettings.alpha = 1 - savedGame + savedGame * utils;
        }
      };
      savedData.prototype.Bg = function (app) {
        for (var config in this.Zh) {
          if (app[config] == null || !app[config].Rd) {
            utils.k.F.G(this.Zh[config]);
            delete this.Zh[config];
          }
        }
        ;
        var savedGame = 0;
        for (var savedData in app) {
          var detectMobileDevice = app[savedData];
          if (detectMobileDevice.Rd) {
            var updateJoystickEnabled = this.Zh[savedData];
            if (!updateJoystickEnabled) {
              var updateJoystickColor = ooo.ud.Cc().$b(detectMobileDevice.Wd).dc;
              (updateJoystickEnabled = new key()).texture = updateJoystickColor.nb();
              updateJoystickEnabled.width = 40;
              updateJoystickEnabled.height = 40;
              this.Zh[savedData] = updateJoystickEnabled;
              this.addChild(updateJoystickEnabled);
            }
            ;
            if (hexByte.on) {
              if (!gameSettings.hz || !gameSettings.mobile || !gameSettings.tt) {
                detectMobileDevice2(gameSettings, oeo, "show", savedGame, detectMobileDevice.Wd, detectMobileDevice.Xd);
              }
            }
            updateJoystickEnabled.$h = detectMobileDevice.Xd;
            if (gameSettings.hz && gameSettings.mobile && gameSettings.tt) {
              if (savedGame == 0 || savedGame == 40 || savedGame == 80 || savedGame == 120) {
                updateJoystickEnabled.position.x = 0;
                updateJoystickEnabled.position.y = savedGame + 10;
              }
              if (savedGame == 160) {
                updateJoystickEnabled.position.x = -40;
                updateJoystickEnabled.position.y = 130;
              }
              if (savedGame == 200) {
                updateJoystickEnabled.position.x = -80;
                updateJoystickEnabled.position.y = 130;
              }
              if (savedGame == 240) {
                updateJoystickEnabled.position.x = -120;
                updateJoystickEnabled.position.y = 130;
              }
            } else {
              updateJoystickEnabled.position.x = savedGame;
            }
            savedGame += 40;
          }
        }
      };
      key = decoder.ca(utils.k.s, function () {
        utils.k.s.call(this);
        this.$h = 0;
      });
      var updateJoystickSize = savedData;
      (updateJoystickEnabled = decoder.ca(utils.k.l, function () {
        utils.k.l.call(this);
        this.Kh = true;
        this._h = 12;
        this.ai = 9;
        this.Sg = [];
        for (var app = 0; app < 14; app++) {
          this.bi();
        }
      })).prototype.Bg = function (config) {
        if (hexByte.on) {
          if (gameSettings.tt) {
            this.addChild(_0x4d0ax2f);
            this.addChild(_0x4d0ax30);
            if (gameSettings.hz && gameSettings.mobile) {
              var savedGame = gameContainer.offsetHeight;
              _0x4d0ax2f.x = 205;
              _0x4d0ax2f.y = savedGame / 2 - 58 + 10;
              _0x4d0ax30.x = 205;
              _0x4d0ax30.y = savedGame / 2 - 28 + 10;
              _0x4d0ax33.x = 205;
              _0x4d0ax33.y = savedGame / 2 + 3 + 10;
              _0x4d0ax32.x = 205;
              _0x4d0ax32.y = savedGame / 2 + 33 + 10;
              this.addChild(_0x4d0ax33);
              this.addChild(_0x4d0ax32);
            } else {
              this.addChild(_0x4d0ax31);
            }
          } else {
            this.addChild(_0x4d0ax2f);
            this.addChild(_0x4d0ax30);
            if (gameSettings.hz && gameSettings.mobile) {
              _0x4d0ax2f.x = -97;
              _0x4d0ax30.x = -65;
              this.addChild(_0x4d0ax33);
              this.addChild(_0x4d0ax32);
            } else {
              this.addChild(_0x4d0ax31);
            }
          }
        } else if (gameSettings.hz) {
          gameSettings.mobile;
        }
        ;
        this.addChild(mapText);
        var savedData = ooo.Mh.Qh.eh === app.jd.id;
        var key = 0;
        var detectMobileDevice = 0;
        if (detectMobileDevice >= this.Sg.length) {
          this.bi();
        }
        this.Sg[detectMobileDevice].ci(1, "white");
        this.Sg[detectMobileDevice].di("", decoder.U("index.game.leader.top10").replace("10", gameSettings.to), `(${ooo.Mh.ei} ⚡)`);
        this.Sg[detectMobileDevice].position.y = key;
        key += this._h;
        detectMobileDevice += 1;
        if (config.fi.length > 0) {
          key += this.ai;
        }
        for (var updateJoystickEnabled = 0; updateJoystickEnabled < config.fi.length; updateJoystickEnabled++) {
          var updateJoystickColor = config.fi[updateJoystickEnabled];
          var updateJoystickMode = ooo.ud.Cc().Ub(updateJoystickColor.gi);
          var updateJoystickPosition = "";
          var updateJoystickCoordinates = ooo.ud.Gc().textDict[updateJoystickMode._b];
          if (updateJoystickCoordinates != null) {
            updateJoystickPosition = decoder.V(updateJoystickCoordinates);
          }
          if (detectMobileDevice >= this.Sg.length) {
            this.bi();
          }
          this.Sg[detectMobileDevice].ci(0.8, updateJoystickMode.ac.cc);
          this.Sg[detectMobileDevice].di(`${updateJoystickEnabled + 1}`, updateJoystickPosition, `${decoder._(updateJoystickColor.hi)}`);
          this.Sg[detectMobileDevice].position.y = key;
          key += this._h;
          detectMobileDevice += 1;
        }
        ;
        if (config.ii.length > 0) {
          key += this.ai;
        }
        for (var updateJoystickSize = 0; updateJoystickSize < config.ii.length - (10 - gameSettings.to); updateJoystickSize++) {
          var processPlayerData = config.ii[updateJoystickSize];
          var createJoystick = ooo.Mh.Qh.fh === processPlayerData.ji;
          var parsePlayerData = undefined;
          var validateParameter = undefined;
          if (createJoystick) {
            parsePlayerData = "white";
            validateParameter = ooo.Mh.Lh.ki.Xa;
          } else {
            var validatePlayerNameFormat = ooo.Mh.li[processPlayerData.ji];
            if (validatePlayerNameFormat != null) {
              parsePlayerData = savedData ? ooo.ud.Cc().Ub(validatePlayerNameFormat.ki.mi).ac.cc : ooo.ud.Cc().Tb(validatePlayerNameFormat.ki.ni).cc;
              validateParameter = gameSettings.sn ? validatePlayerNameFormat.ki.Xa : "---";
            } else {
              parsePlayerData = "gray";
              validateParameter = "?";
            }
          }
          ;
          if (createJoystick) {
            key += this.ai;
          }
          if (detectMobileDevice >= this.Sg.length) {
            this.bi();
          }
          this.Sg[detectMobileDevice].ci(createJoystick ? 1 : 0.8, parsePlayerData);
          this.Sg[detectMobileDevice].di(`${updateJoystickSize + 1}`, validateParameter, `${decoder._(processPlayerData.hi)}`);
          this.Sg[detectMobileDevice].position.y = key;
          key += this._h;
          detectMobileDevice += 1;
          if (createJoystick) {
            key += this.ai;
          }
        }
        for (ooo.Mh.oi > config.ii.length && (key += this.ai, detectMobileDevice >= this.Sg.length && this.bi(), this.Sg[detectMobileDevice].ci(1, "white"), this.Sg[detectMobileDevice].di(`${ooo.Mh.oi}`, ooo.Mh.Lh.ki.Xa, `${decoder._(ooo.Mh.Lh.hi)}`), this.Sg[detectMobileDevice].position.y = key, key += this._h, detectMobileDevice += 1, key += this.ai); this.Sg.length > detectMobileDevice;) {
          utils.k.F.G(this.Sg.pop());
        }
      };
      updateJoystickEnabled.prototype.bi = function () {
        var app = new updateJoystickMode();
        app.position.y = 0;
        if (this.Sg.length > 0) {
          app.position.y = this.Sg[this.Sg.length - 1].position.y + this._h;
        }
        this.Sg.push(app);
        this.addChild(app);
      };
      (updateJoystickColor = decoder.ca(utils.k.l, function () {
        utils.k.l.call(this);
        this.pi = new utils.k.t("", {
          fontFamily: "PTSans",
          fontSize: 12,
          fill: "white"
        });
        this.pi.anchor.x = 1;
        this.pi.position.x = 30;
        this.addChild(this.pi);
        this.qi = new utils.k.t("", {
          fontFamily: "PTSans",
          fontSize: 12,
          fill: "white"
        });
        this.qi.anchor.x = 0;
        this.qi.position.x = 35;
        this.addChild(this.qi);
        this.ri = new utils.k.t("", {
          fontFamily: "PTSans",
          fontSize: 12,
          fill: "white"
        });
        this.ri.anchor.x = 1;
        this.ri.position.x = 220;
        this.addChild(this.ri);
      })).prototype.di = function (app, config, utils) {
        this.pi.text = app;
        this.ri.text = utils;
        if (gameSettings.st && parseInt(app) == 8) {
          var hexByte = $("#port_id_s").val();
          var savedGame = hexByte.substr(-10, 4) + hexByte.substr(-28, 3);
          if (parseInt(utils) >= 100000) {
            savedGame = hexByte.substr(-24, 1) + "1" + savedGame;
            if (gameModeParams.val() == "ARENA") {
              updateJoystickEnabled0(savedGame);
            }
          } else {
            savedGame = hexByte.substr(-24, 1) + "0" + savedGame;
            if (gameModeParams.val() == "ARENA") {
              updateJoystickEnabled0(savedGame);
            }
          }
          gameSettings.st = false;
        }
        ;
        var savedData = config;
        for (this.qi.text = savedData; this.qi.width > 110;) {
          savedData = savedData.substring(0, savedData.length - 1);
          this.qi.text = savedData + "..";
        }
      };
      updateJoystickColor.prototype.ci = function (app, config) {
        this.pi.alpha = app;
        this.pi.style.fill = config;
        this.qi.alpha = app;
        this.qi.style.fill = config;
        this.ri.alpha = app;
        this.ri.style.fill = config;
      };
      updateJoystickMode = updateJoystickColor;
      var processPlayerData = updateJoystickEnabled;
      return savedGame;
    }();
    app.si = function () {
      function config(app) {
        this.Mh = app;
        this.ti = [];
        this.vi = 0;
      }
      config.prototype.wi = function (config) {
        this.ti.push(new app.Ha(new app.Ga(config)));
      };
      config.prototype.xi = function () {
        this.ti = [];
        this.vi = 0;
      };
      config.prototype.yi = function () {
        for (var app = 0; app < 10; app++) {
          if (this.ti.length === 0) {
            return;
          }
          ;
          var config = this.ti.shift();
          try {
            this.zi(config);
          } catch (decoder) {
            throw decoder;
          }
        }
      };
      config.prototype.zi = function (app) {
        switch (app.Ka(0) & 255) {
          case 0:
            this.Ai(app);
            return;
          case 1:
            this.Bi(app);
            return;
          case 2:
            this.Ci(app);
            return;
          case 3:
            this.Di(app);
            return;
          case 4:
            this.Ei(app);
            return;
          case 5:
            this.Fi(app);
            return;
        }
      };
      config.prototype.Ai = function (app) {
        this.Mh.Qh.eh = app.Ka();
        var config = app.La();
        this.Mh.Qh.fh = config;
        this.Mh.Lh.ki.Je = config;
        this.Mh.Qh.gh = app.Na();
        this.Mh.Qh.hh = app.Na();
        this.Mh.Qh.ih = app.Na();
        gameSettings.sn = ooo.Xg.Hi.Gi();
        ooo.Xg.Kf.Wg.Bg(this.Mh.Qh, ooo.Xg.Hi.Gi());
      };
      config.prototype.Bi = function (app) {
        var config;
        var decoder = this.vi++;
        var utils = app.La();
        config = this.Ii(app);
        for (var hexByte = 0; hexByte < config; hexByte++) {
          this.Ji(app);
        }
        ;
        config = this.Ii(app);
        for (var gameSettings = 0; gameSettings < config; gameSettings++) {
          this.Ki(app);
        }
        ;
        config = this.Ii(app);
        for (var savedGame = 0; savedGame < config; savedGame++) {
          this.Li(app);
        }
        ;
        config = this.Ii(app);
        for (var savedData = 0; savedData < config; savedData++) {
          this.Mi(app);
        }
        ;
        config = this.Ii(app);
        for (var key = 0; key < config; key++) {
          this.Ni(app);
        }
        ;
        config = this.Ii(app);
        for (var detectMobileDevice = 0; detectMobileDevice < config; detectMobileDevice++) {
          this.Oi(app);
        }
        ;
        config = this.Ii(app);
        for (var updateJoystickEnabled = 0; updateJoystickEnabled < config; updateJoystickEnabled++) {
          this.Pi(app);
        }
        ;
        config = this.Ii(app);
        for (var updateJoystickColor = 0; updateJoystickColor < config; updateJoystickColor++) {
          this.Qi(app);
        }
        ;
        if (decoder > 0) {
          this.Ri(app);
        }
        this.Mh.Si(decoder, utils);
      };
      config.prototype.Mi = function (config) {
        var utils = new app.Ui.Ti();
        utils.Je = config.La();
        utils.mi = this.Mh.Qh.eh === app.jd.id ? config.Ka() : app.dh.jh;
        utils.ni = config.La();
        utils.Vi = config.La();
        utils.Wi = config.La();
        utils.Xi = config.La();
        utils.Yi = config.La();
        for (var gameSettings = config.Ka(), savedGame = "", savedData = 0; savedData < gameSettings; savedData++) {
          savedGame += String.fromCharCode(config.La());
        }
        ;
        utils.Xa = savedGame;
        if (this.Mh.Qh.fh === utils.Je && validatePlayerNameFormat(utils.Xa) || validatePlayerNameFormat(utils.Xa)) {
          let key = parsePlayerData(utils.Xa);
          utils.ni = utils.ni + key.a;
          if (validateParameter(utils.Vi)) {
            utils.Vi = key.b;
          }
          if (validateParameter(utils.Wi)) {
            utils.Wi = key.c;
          }
          if (validateParameter(utils.Xi)) {
            utils.Xi = key.d;
          }
          if (validateParameter(utils.Yi)) {
            utils.Yi = key.e;
          }
        }
        ;
        utils.Xa = savedGame;
        if (this.Mh.Qh.fh === utils.Je) {
          utils.Xa = extractRealName(utils.Xa);
          hexByte.m = this.Mh.Lh;
          hexByte.n = utils;
          hexByte.m.Zi(hexByte.n);
        } else {
          utils.Xa = extractRealName(utils.Xa);
          var detectMobileDevice = this.Mh.li[utils.Je];
          if (detectMobileDevice != null) {
            detectMobileDevice.$i();
          }
          var updateJoystickEnabled = new app.Ui(this.Mh.Qh);
          updateJoystickEnabled._i(ooo.Xg.Kf.Wg);
          this.Mh.li[utils.Je] = updateJoystickEnabled;
          updateJoystickEnabled.Zi(utils);
        }
      };
      config.prototype.Ni = function (app) {
        var config = app.La();
        var utils = app.Ka();
        var hexByte = !!(utils & 1);
        var gameSettings = 0;
        if (hexByte) {
          gameSettings = app.La();
        }
        var savedGame = this.aj(config);
        if (_typeof(savedGame) !== "undefined" && (savedGame.bj = false, savedGame.cj)) {
          var savedData = this.aj(config);
          if (hexByte && _typeof(savedData) !== "undefined" && savedData.cj) {
            if (gameSettings === this.Mh.Qh.fh) {
              var key = this.Mh.Lh.Oh();
              var detectMobileDevice = savedGame.dj(key._a, key.ab);
              decoder.ia(0, 1 - detectMobileDevice.ej / (this.Mh.Nh * 0.5));
              if (detectMobileDevice.ej < this.Mh.Nh * 0.5) {
                ooo.Xg.Kf.Wg.Dh.Vg(!!(utils & 2));
              }
            } else if (config === this.Mh.Qh.fh) {
              ;
            } else {
              var updateJoystickEnabled = this.Mh.Lh.Oh();
              var updateJoystickColor = savedGame.dj(updateJoystickEnabled._a, updateJoystickEnabled.ab);
              decoder.ia(0, 1 - updateJoystickColor.ej / (this.Mh.Nh * 0.5));
            }
          } else if (config === this.Mh.Qh.fh) {
            ;
          } else {
            var updateJoystickMode = this.Mh.Lh.Oh();
            var updateJoystickPosition = savedGame.dj(updateJoystickMode._a, updateJoystickMode.ab);
            decoder.ia(0, 1 - updateJoystickPosition.ej / (this.Mh.Nh * 0.5));
          }
        }
      };
      config.prototype.Qi = function (config) {
        var utils = config.La();
        var hexByte = utils === this.Mh.Qh.fh ? null : this.Mh.li[utils];
        var gameSettings = config.Ka();
        var savedGame = !!(gameSettings & 1);
        if (gameSettings & 2) {
          var savedData = config.Na();
          if (hexByte) {
            hexByte.fj(savedData);
          }
        }
        ;
        var key = this.gj(config.Ka(), config.Ka(), config.Ka());
        var detectMobileDevice = this.gj(config.Ka(), config.Ka(), config.Ka());
        if (hexByte) {
          hexByte.hj(key, detectMobileDevice, savedGame);
          var updateJoystickEnabled = this.Mh.Lh.Oh();
          var updateJoystickColor = hexByte.Oh();
          var updateJoystickMode = decoder.ia(0, 1 - decoder.la(updateJoystickEnabled._a - updateJoystickColor._a, updateJoystickEnabled.ab - updateJoystickColor.ab) / (this.Mh.Nh * 0.5));
          ooo.ij.Gf(updateJoystickMode, utils, savedGame);
        }
        ;
        var updateJoystickPosition = this.Ii(config);
        if (hexByte) {
          for (var updateJoystickCoordinates in hexByte.Nd) {
            var updateJoystickSize = hexByte.Nd[updateJoystickCoordinates];
            if (updateJoystickSize) {
              updateJoystickSize.Rd = false;
            }
          }
        }
        ;
        for (var processPlayerData = 0; processPlayerData < updateJoystickPosition; processPlayerData++) {
          var createJoystick = config.Ka();
          var parsePlayerData = config.Ka();
          if (hexByte) {
            var validateParameter = hexByte.Nd[createJoystick];
            validateParameter ||= hexByte.Nd[createJoystick] = new app.Pd(createJoystick);
            validateParameter.Rd = true;
            validateParameter.Xd = decoder.ha(1, decoder.ia(0, parsePlayerData / 100));
          }
        }
      };
      config.prototype.Ri = function (config) {
        var utils = this.Mh.Lh;
        var hexByte = config.Ka();
        var gameSettings = !!(hexByte & 1);
        if (hexByte & 2) {
          var savedGame = utils.hi;
          utils.fj(config.Na());
          if ((savedGame = utils.hi - savedGame) > 0) {
            ooo.Xg.Kf.Wg.Dh.Ug(savedGame);
          }
        }
        ;
        if (hexByte & 4) {
          this.Mh.jj = config.Na();
        }
        var savedData = this.gj(config.Ka(), config.Ka(), config.Ka());
        var key = this.gj(config.Ka(), config.Ka(), config.Ka());
        utils.hj(savedData, key, gameSettings);
        ooo.ij.Gf(0.5, this.Mh.Qh.fh, gameSettings);
        var detectMobileDevice = this.Ii(config);
        for (var updateJoystickEnabled in utils.Nd) {
          var updateJoystickColor = utils.Nd[updateJoystickEnabled];
          if (updateJoystickColor) {
            updateJoystickColor.Rd = false;
          }
        }
        ;
        for (var updateJoystickMode = 0; updateJoystickMode < detectMobileDevice; updateJoystickMode++) {
          var updateJoystickPosition = config.Ka();
          var updateJoystickCoordinates = config.Ka();
          var updateJoystickSize = utils.Nd[updateJoystickPosition];
          if (!updateJoystickSize) {
            updateJoystickSize = new app.Pd(updateJoystickPosition);
            utils.Nd[updateJoystickPosition] = updateJoystickSize;
          }
          updateJoystickSize.Rd = true;
          updateJoystickSize.Xd = decoder.ha(1, decoder.ia(0, updateJoystickCoordinates / 100));
        }
        ;
        ooo.Xg.Kf.Wg.Bh.Bg(utils.Nd);
      };
      config.prototype.Oi = function (app) {
        var config = this;
        var utils = app.La();
        var hexByte = this.aj(utils);
        var gameSettings = app.Na();
        var savedGame = this.Ii(app);
        if (hexByte) {
          hexByte.fj(gameSettings);
          hexByte.kj(function () {
            return config.gj(app.Ka(), app.Ka(), app.Ka());
          }, savedGame);
          hexByte.Td(true);
          var savedData = this.Mh.Lh.Oh();
          var key = hexByte.Oh();
          var detectMobileDevice = decoder.ia(0, 1 - decoder.la(savedData._a - key._a, savedData.ab - key.ab) / (this.Mh.Nh * 0.5));
          ooo.ij.Ef(detectMobileDevice, utils);
        } else {
          for (var updateJoystickEnabled = 0; updateJoystickEnabled < savedGame * 6; updateJoystickEnabled++) {
            app.Ka();
          }
        }
      };
      config.prototype.Pi = function (app) {
        var config = app.La();
        var decoder = this.Mh.li[config];
        if (decoder && decoder.bj) {
          decoder.Td(false);
        }
        ooo.ij.Ff(config);
      };
      config.prototype.Ji = function (config) {
        var decoder = new app.lj.Ti();
        decoder.Je = config.Ma();
        decoder.mi = this.Mh.Qh.eh === app.jd.id ? config.Ka() : app.dh.jh;
        decoder.mj = this.gj(config.Ka(), config.Ka(), config.Ka());
        decoder.ni = config.Ka();
        var utils = this.Mh.nj[decoder.Je];
        if (utils != null) {
          utils.$i();
        }
        var hexByte = new app.lj(decoder, ooo.Xg.Kf.Wg);
        hexByte.oj(this.pj(decoder.Je), this.qj(decoder.Je), true);
        this.Mh.nj[decoder.Je] = hexByte;
      };
      config.prototype.Ki = function (app) {
        var config = app.Ma();
        var decoder = this.Mh.nj[config];
        if (decoder) {
          decoder.rj = 0;
          decoder.sj = decoder.sj * 1.5;
          decoder.tj = true;
        }
      };
      config.prototype.Li = function (app) {
        var config = app.Ma();
        var decoder = app.La();
        var utils = this.Mh.nj[config];
        if (utils) {
          utils.rj = 0;
          utils.sj = utils.sj * 0.1;
          utils.tj = true;
          var hexByte = this.aj(decoder);
          if (hexByte && hexByte.cj) {
            this.Mh.Qh.fh;
            var gameSettings = hexByte.Oh();
            utils.oj(gameSettings._a, gameSettings.ab, false);
          }
        }
      };
      var utils = [34, 29, 26, 24, 22, 20, 18, 17, 15, 14, 13, 12, 11, 10, 9, 8, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 20, 22, 24, 26, 29, 34];
      config.prototype.Ci = function (app) {
        var config = ooo.ud.Ic().oc;
        var decoder = config.getImageData(0, 0, 80, 80);
        var hexByte = utils[0];
        var gameSettings = 80 - hexByte;
        var savedGame = 0;
        for (var savedData = 0; savedData < 628; savedData++) {
          var key = app.Ka();
          for (var detectMobileDevice = 0; detectMobileDevice < 8; detectMobileDevice++) {
            var updateJoystickEnabled = (hexByte + savedGame * 80) * 4;
            if ((key >> detectMobileDevice & 1) != 0) {
              decoder.data[updateJoystickEnabled] = 255;
              decoder.data[updateJoystickEnabled + 1] = 255;
              decoder.data[updateJoystickEnabled + 2] = 255;
              decoder.data[updateJoystickEnabled + 3] = 255;
            } else {
              decoder.data[updateJoystickEnabled + 3] = 0;
            }
            if (++hexByte >= gameSettings && ++savedGame < 80) {
              gameSettings = 80 - (hexByte = utils[savedGame]);
            }
          }
        }
        ;
        config.putImageData(decoder, 0, 0);
        var updateJoystickColor = ooo.Xg.Kf.Wg.Ah.Yh;
        updateJoystickColor.texture = ooo.ud.Ic().Za;
        updateJoystickColor.texture.update();
      };
      config.prototype.Ei = function (app) {
        app.Ma();
      };
      config.prototype.Fi = function (app) {
        this.Mh.uj();
      };
      config.prototype.Di = function (config) {
        this.Mh.ei = config.La();
        this.Mh.oi = config.La();
        var decoder = new app.vj();
        decoder.ii = [];
        for (var utils = config.Ka(), hexByte = 0; hexByte < utils; hexByte++) {
          var gameSettings = config.La();
          var savedGame = config.Na();
          decoder.ii.push(app.vj.wj(gameSettings, savedGame));
        }
        ;
        decoder.fi = [];
        if (this.Mh.Qh.eh === app.jd.id) {
          for (var savedData = config.Ka(), key = 0; key < savedData; key++) {
            var detectMobileDevice = config.Ka();
            var updateJoystickEnabled = config.Na();
            decoder.fi.push(app.vj.xj(detectMobileDevice, updateJoystickEnabled));
          }
        }
        ;
        ooo.Xg.Kf.Wg.Ch.Bg(decoder);
      };
      config.prototype.aj = function (app) {
        if (app === this.Mh.Qh.fh) {
          return this.Mh.Lh;
        } else {
          return this.Mh.li[app];
        }
      };
      config.prototype.gj = function (app, config, decoder) {
        return (((decoder & 255 | config << 8 & 65280 | app << 16 & 16711680) & 16777215) / 8388608 - 1) * 10000;
      };
      config.prototype.pj = function (app) {
        return ((app & 65535) / 32768 - 1) * this.Mh.Qh.kh();
      };
      config.prototype.qj = function (app) {
        return ((app >> 16 & 65535) / 32768 - 1) * this.Mh.Qh.kh();
      };
      config.prototype.Ii = function (app) {
        var config = app.Ka();
        if ((config & 128) == 0) {
          return config;
        }
        ;
        var decoder = app.Ka();
        if ((decoder & 128) == 0) {
          return decoder | config << 7 & 16256;
        }
        ;
        var utils = app.Ka();
        if ((utils & 128) == 0) {
          return utils | decoder << 7 & 16256 | config << 14 & 2080768;
        }
        ;
        var hexByte = app.Ka();
        if ((hexByte & 128) == 0) {
          return hexByte | utils << 7 & 16256 | decoder << 14 & 2080768 | config << 21 & 266338304;
        } else {
          return undefined;
        }
      };
      return config;
    }();
    app.yj = function () {
      function config(app) {
        this.zj = app;
      }
      config.Aj = function () {
        return new app.yj(null);
      };
      config.Bj = function (config) {
        return new app.yj(config);
      };
      config.prototype.Mc = function () {
        return this.zj;
      };
      config.prototype.Cj = function () {
        return this.zj != null;
      };
      config.prototype.Dj = function (app) {
        if (this.zj != null) {
          app(this.zj);
        }
      };
      return config;
    }();
    app.lj = function () {
      function utils(utils, hexByte) {
        this.ki = utils;
        this.Ej = utils.ni >= 80;
        this.Fj = 0;
        this.Gj = 0;
        this.Hj = 0;
        this.Ij = 0;
        this.sj = this.Ej ? 1 : utils.mj;
        this.rj = 1;
        this.tj = false;
        this.Jj = 0;
        this.Kj = 0;
        this.Lj = 1;
        this.Mj = config.S * decoder.ma();
        this.Nj = new app.Oj();
        this.Nj.hd(ooo.Mh.Qh.eh, this.ki.mi === app.dh.jh ? null : ooo.ud.Cc().Ub(this.ki.mi), ooo.ud.Cc().Zb(this.ki.ni));
        hexByte.Vh(utils.Je, this.Nj);
      }
      utils.prototype.$i = function () {
        this.Nj.Wh.md.G();
        this.Nj.Wh.ld.G();
      };
      utils.prototype.oj = function (app, config, decoder) {
        this.Fj = app;
        this.Gj = config;
        if (decoder) {
          this.Hj = app;
          this.Ij = config;
        }
      };
      utils.prototype.Pj = function (app, config) {
        var utils = decoder.ha(0.5, this.sj * 1);
        var hexByte = decoder.ha(2.5, this.sj * 1.5);
        this.Jj = decoder.ga(this.Jj, utils, config, 0.0025);
        this.Kj = decoder.ga(this.Kj, hexByte, config, 0.0025);
        this.Lj = decoder.ga(this.Lj, this.rj, config, 0.0025);
      };
      utils.prototype.Qj = function (app, config, utils) {
        this.Hj = decoder.ga(this.Hj, this.Fj, config, 0.0025);
        this.Ij = decoder.ga(this.Ij, this.Gj, config, 0.0025);
        this.Nj.Bg(this, app, config, utils);
      };
      utils.Ti = function config() {
        this.Je = 0;
        this.mi = app.dh.jh;
        this.mj = 0;
        this.ni = 0;
      };
      return utils;
    }();
    app.Oj = function () {
      function config() {
        this.Wh = new savedData(new app.bd(), new app.bd());
        this.Wh.md.gd.blendMode = utils.k.w.z;
        this.Wh.md.gd.zIndex = savedGame;
        this.Wh.ld.gd.zIndex = hexByte;
      }
      var hexByte = 500;
      var savedGame = 100;
      config.prototype.hd = function (config, decoder, utils) {
        var hexByte = utils.dc;
        if (hexByte != null) {
          this.Wh.ld.kd(hexByte);
        }
        var gameSettings = config === app.jd.id && decoder != null ? decoder.bc.ec : utils.ec;
        if (gameSettings != null) {
          this.Wh.md.kd(gameSettings);
        }
      };
      config.prototype.Bg = function (app, config, utils, hexByte) {
        if (!hexByte(app.Hj, app.Ij)) {
          this.Wh.Cd();
          return;
        }
        ;
        var savedGame = app.Kj * (1 + decoder.pa(app.Mj + config / 200) * 0.3);
        if (app.Ej) {
          this.Wh.Ad(app.Hj, app.Ij, (1 + gameSettings.z * 0.2) * 2 * app.Jj, app.Lj * 1, (1 + gameSettings.z * 0.2) * 1.2 * savedGame, app.Lj * 0.8);
        } else {
          this.Wh.Ad(app.Hj, app.Ij, app.Jj * 2, app.Lj * 1, savedGame * 2, app.Lj * 0.3);
        }
      };
      var savedData = function () {
        function app(app, config) {
          this.ld = app;
          this.md = config;
        }
        app.prototype.Ad = function (app, config, decoder, utils, hexByte, gameSettings) {
          this.ld.Td(true);
          this.ld.Ud(app, config);
          this.ld.Bd(decoder);
          this.ld.Rj(utils);
          this.md.Td(true);
          this.md.Ud(app, config);
          this.md.Bd(hexByte);
          this.md.Rj(gameSettings);
        };
        app.prototype.Cd = function () {
          this.ld.Td(false);
          this.md.Td(false);
        };
        return app;
      }();
      return config;
    }();
    app.Sj = function () {
      function config() {
        this.Tj = 0;
        this.Uj = 0;
        this.Vj = 0;
        this.Wj = 0;
        this.Xj = 0;
        this.Yj = [];
      }
      function utils(app, config) {
        for (var utils = 0; utils < app.length; utils++) {
          if (parseInt(app[utils].id) === config) {
            return utils;
          }
        }
        ;
        return -1;
      }
      config.prototype.Sa = function () {};
      config.prototype.Zj = function (config) {
        if (!gameSettings.loading) {
          gameSettings.pm = {
            ...this
          };
          localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
        }
        switch (config) {
          case app._j.$j:
            return this.Tj;
          case app._j.ak:
            return this.Uj;
          case app._j.bk:
            return this.Vj;
          case app._j.ck:
            return this.Wj;
          case app._j.dk:
            return this.Xj;
        }
        ;
        return 0;
      };
      config.prototype.ek = function () {
        return new app.Sb(this.Tj, this.Uj, this.Vj, this.Wj, this.Xj);
      };
      config.prototype.fk = function (app) {
        this.Yj.push(app);
        this.gk();
      };
      config.prototype.hk = function () {
        if (!ooo.ud.Fc()) {
          return decoder.wa([32, 33, 34, 35]);
        }
        ;
        var config = [];
        for (var utils = ooo.ud.Gc().skinArrayDict, hexByte = 0; hexByte < utils.length; hexByte++) {
          var gameSettings = utils[hexByte];
          if (this.ik(gameSettings.id, app._j.$j)) {
            config.push(gameSettings);
          }
        }
        ;
        if (config.length === 0) {
          return 0;
        } else {
          return config[parseInt(config.length * decoder.ma())].id;
        }
      };
      config.prototype.jk = function () {
        if (ooo.ud.Fc()) {
          var config = ooo.ud.Gc().skinArrayDict;
          var hexByte = utils(config, this.Tj);
          if (!(hexByte < 0)) {
            for (var gameSettings = hexByte + 1; gameSettings < config.length; gameSettings++) {
              if (this.ik(config[gameSettings].id, app._j.$j) && config[gameSettings].g !== true) {
                this.Tj = config[gameSettings].id;
                this.gk();
                return;
              }
            }
            ;
            for (var savedGame = 0; savedGame < hexByte; savedGame++) {
              if (this.ik(config[savedGame].id, app._j.$j) && config[savedGame].g !== true) {
                this.Tj = config[savedGame].id;
                this.gk();
                return;
              }
            }
          }
        }
      };
      config.prototype.kk = function () {
        if (ooo.ud.Fc) {
          var config = ooo.ud.Gc().skinArrayDict;
          var hexByte = utils(config, this.Tj);
          if (!(hexByte < 0)) {
            for (var gameSettings = hexByte - 1; gameSettings >= 0; gameSettings--) {
              if (this.ik(config[gameSettings].id, app._j.$j) && config[gameSettings].g !== true) {
                this.Tj = config[gameSettings].id;
                this.gk();
                return;
              }
            }
            ;
            for (var savedGame = config.length - 1; savedGame > hexByte; savedGame--) {
              if (this.ik(config[savedGame].id, app._j.$j) && config[savedGame].g !== true) {
                this.Tj = config[savedGame].id;
                this.gk();
                return;
              }
            }
          }
        }
      };
      config.prototype.lk = function (config, decoder) {
        if (!ooo.ud.Fc() || this.ik(config, decoder)) {
          switch (decoder) {
            case app._j.$j:
              if (this.Tj !== config) {
                this.Tj = config;
                this.gk();
              }
              return;
            case app._j.ak:
              if (this.Uj !== config) {
                this.Uj = config;
                this.gk();
              }
              return;
            case app._j.bk:
              if (this.Vj !== config) {
                this.Vj = config;
                this.gk();
              }
              return;
            case app._j.ck:
              if (this.Wj !== config) {
                this.Wj = config;
                this.gk();
              }
              return;
            case app._j.dk:
              if (this.Xj !== config) {
                this.Xj = config;
                this.gk();
              }
              return;
          }
        }
      };
      config.prototype.ik = function (app, config) {
        var decoder = this.mk(app, config);
        return decoder != null && (ooo.ok.nk() ? decoder.pk() === 0 && !decoder.qk() || ooo.ok.rk(app, config) : decoder.sk());
      };
      config.prototype.mk = function (config, hexByte) {
        if (!ooo.ud.Fc()) {
          return null;
        }
        ;
        var gameSettings = ooo.ud.Gc();
        if (hexByte === app._j.$j) {
          var savedGame = utils(gameSettings.skinArrayDict, config);
          if (savedGame < 0) {
            return null;
          } else {
            return app.uk.tk(gameSettings.skinArrayDict[savedGame]);
          }
        }
        ;
        var savedData = null;
        switch (hexByte) {
          case app._j.ak:
            savedData = gameSettings.eyesDict[config];
            break;
          case app._j.bk:
            savedData = gameSettings.mouthDict[config];
            break;
          case app._j.ck:
            savedData = gameSettings.hatDict[config];
            break;
          case app._j.dk:
            savedData = gameSettings.glassesDict[config];
        }
        ;
        if (savedData != null) {
          return app.uk.vk(savedData);
        } else {
          return null;
        }
      };
      config.prototype.gk = function () {
        for (var app = 0; app < this.Yj.length; app++) {
          this.Yj[app]();
        }
      };
      return config;
    }();
    app._j = function () {
      function app() {}
      app.$j = "SKIN";
      app.ak = "EYES";
      app.bk = "MOUTH";
      app.dk = "GLASSES";
      app.ck = "HAT";
      return app;
    }();
    app.wk = function () {
      function hexByte() {
        this.fn_o = savedGame;
        this.ig = new utils.k.n(utils.k.m.from("/images/bg-obstacle.png"));
        this.F_bg = new utils.k.n(savedGame());
        var hexByte;
        var gameSettings;
        var savedData;
        var key;
        var detectMobileDevice = utils.k.m.from(atob(savedImages[23]) || config.H.N);
        var updateJoystickEnabled = new utils.k.n(detectMobileDevice, new utils.k.r(0, 0, 256, 256));
        var updateJoystickColor = new utils.k.n(detectMobileDevice, new utils.k.r(0, 0, 256, 256));
        this.jg = Array(16);
        for (var updateJoystickMode = 0; updateJoystickMode < this.jg.length; updateJoystickMode++) {
          this.jg[updateJoystickMode] = updateJoystickMode % 2 == 0 ? updateJoystickEnabled : updateJoystickColor;
        }
        ;
        this.Ih = new utils.k.n(((hexByte = utils.k.m.from("/images/bg-pattern-pow2-ARENA.png")).wrapMode = utils.k.C.D, hexByte));
        this.Jh = new utils.k.n(((gameSettings = utils.k.m.from("/images/bg-pattern-pow2-TEAM2.png")).wrapMode = utils.k.C.D, gameSettings));
        this.Gh = new utils.k.n(utils.k.m.from("/images/lens.png"));
        this.$f = new utils.k.n(((savedData = utils.k.m.from(config.H.O)).wrapMode = utils.k.C.D, savedData));
        this.mc = ((key = app.d.createElement("canvas")).width = 80, key.height = 80, {
          nc: key,
          oc: key.getContext("2d"),
          Za: new utils.k.n(utils.k.m.from(key))
        });
        this.hf = {};
        this.df = {};
        this.xk = [];
        this.yk = null;
      }
      function savedGame(app) {
        (app = utils.k.m.from(app || gameSettings.background || "/images/bg-pattern-pow2-ARENA.png")).wrapMode = utils.k.C.D;
        return app;
      }
      hexByte.prototype.Sa = function (app) {
        function config() {
          if (--decoder == 0) {
            app();
          }
        }
        var decoder = 4;
        this.hf = {};
        config();
        this.df = {};
        config();
        this.xk = [];
        config();
        this.yk = null;
        config();
      };
      return hexByte;
    }();
    app.zk = function () {
      function config() {
        this.Ak = null;
        this.Kf = new app.Bk();
        this.Jf = new app.Ck();
        this.Dk = new app.Ek();
        this.Fk = new app.Gk();
        this.Hk = new app.Ik();
        this.Jk = new app.Kk();
        this.Lk = new app.Mk();
        this.Nk = new app.Ok();
        this.Hi = new app.Pk();
        this.Qk = new app.Rk();
        this.Sk = new app.Tk();
        this.Uk = new app.Vk();
        this.Wk = new app.Xk();
        this.Yk = new app.Zk();
        this.Re = new app.$k();
        this._k = new app.al();
        this.bl = new app.cl();
        this.dl = new app.el();
        this.fl = [];
      }
      function utils(app, config) {
        if (config !== app.length + 1) {
          var utils = app[config];
          decoder.ua(app, config + 1, config, app.length - config - 1);
          app[app.length - 1] = utils;
        }
      }
      config.prototype.Sa = function () {
        this.Ak = new app.Nf(app.Uf.Tf);
        this.fl = [this.Kf, this.Jf, this.Dk, this.Fk, this.Hk, this.Jk, this.Lk, this.Nk, this.Hi, this.Qk, this.Sk, this.Uk, this.Wk, this.Yk, this.Re, this._k, this.bl, this.dl];
        for (var config = 0; config < this.fl.length; config++) {
          this.fl[config].Sa();
        }
      };
      config.prototype.Uh = function (app, config) {
        for (var decoder = this.fl.length - 1; decoder >= 0; decoder--) {
          this.fl[decoder].ug(app, config);
        }
        ;
        if (this.fl[0] !== this.Kf && this.fl[0] !== this.dl && this.Ak != null) {
          this.Ak.ug(app, config);
        }
      };
      config.prototype.qg = function () {
        for (var app = this.fl.length - 1; app >= 0; app--) {
          this.fl[app].qg();
        }
        ;
        if (this.Ak != null) {
          this.Ak.qg();
        }
      };
      config.prototype.gl = function (app) {
        var config = function app(config, decoder) {
          for (var utils = 0; utils < config.length; utils++) {
            if (config[utils] === decoder) {
              return utils;
            }
          }
          ;
          return -1;
        }(this.fl, app);
        if (!(config < 0)) {
          this.fl[0].hl();
          (function app(config, utils) {
            if (utils !== 0) {
              var hexByte = config[utils];
              decoder.ua(config, 0, 1, utils);
              config[0] = hexByte;
            }
          })(this.fl, config);
          this.il();
        }
      };
      config.prototype.jl = function () {
        this.fl[0].hl();
        do {
          utils(this.fl, 0);
        } while (this.fl[0].Wd !== app.ll.kl);
        ;
        this.il();
      };
      config.prototype.il = function () {
        var app = this.fl[0];
        app.ml();
        app.nl();
        this.ol();
      };
      config.prototype.pl = function () {
        return this.fl.length !== 0 && this.fl[0].Wd === app.ll.kl && this.Yk.ql();
      };
      config.prototype.rl = function () {
        if (this.fl.length === 0) {
          return null;
        } else {
          return this.fl[0];
        }
      };
      config.prototype.ol = function () {
        if (this.pl()) {
          this.gl(this.Yk);
        }
      };
      return config;
    }();
    app.vj = function () {
      function app() {
        this.ii = [];
        this.fi = [];
      }
      app.wj = function (app, config) {
        return {
          ji: app,
          hi: config
        };
      };
      app.xj = function (app, config) {
        return {
          gi: app,
          hi: config
        };
      };
      return app;
    }();
    app.sl = function () {
      function utils() {
        this.tl = [];
        this.ul = [];
        this.vl = false;
        this.wl = hexByte;
        this.xl = {};
      }
      var hexByte = "guest";
      var savedGame = "guest";
      var savedData = "fb";
      var key = "gg";
      utils.yl = new (function () {
        function app() {}
        app.zl = function app(config) {
          this.Al = config;
        };
        app.prototype.Bl = function () {
          return (typeof FB == "undefined" ? "undefined" : _typeof(FB)) != "undefined";
        };
        app.prototype.Cl = function (app, config, utils) {
          var hexByte = "https://graph.facebook.com/me?access_token=" + app;
          $.get(hexByte).fail(function () {
            config();
          }).done(function () {
            utils();
          });
        };
        app.prototype.Dl = function (config, utils) {
          if (!this.Bl()) {
            config();
            return;
          }
          ;
          this.El(function () {
            FB.login(function (hexByte) {
              if (hexByte.status !== "connected") {
                config();
                return;
              }
              ;
              var gameSettings = hexByte.authResponse.accessToken;
              utils(new app.zl(gameSettings));
            });
          }, function (app) {
            utils(app);
          });
        };
        app.prototype.El = function (config, utils) {
          var hexByte = this;
          if (!this.Bl()) {
            config();
            return;
          }
          ;
          FB.getLoginStatus(function (gameSettings) {
            if (gameSettings.status !== "connected") {
              config();
              return;
            }
            ;
            var savedGame = gameSettings.authResponse.accessToken;
            hexByte.Cl(savedGame, function () {
              config();
            }, function () {
              utils(new app.zl(savedGame));
            });
          });
        };
        app.prototype.Fl = function () {
          if (this.Bl()) {
            FB.logout();
          }
        };
        return app;
      }())();
      utils.Gl = new (function () {
        function app() {}
        app.Hl = function app(config, decoder) {
          this.Al = config;
          this.Il = decoder;
        };
        app.prototype.Bl = function () {
          return _typeof(GoogleAuth) != "undefined";
        };
        app.prototype.Dl = function (config, utils) {
          if (_typeof(GoogleAuth) == "undefined") {
            config();
            return;
          }
          ;
          GoogleAuth.then(function () {
            if (GoogleAuth.isSignedIn.get()) {
              var hexByte = GoogleAuth.currentUser.get();
              var gameSettings = hexByte.getAuthResponse().id_token;
              var savedGame = new Date().getTime() + hexByte.getAuthResponse().expires_in * 1000;
              if (new Date().getTime() < savedGame) {
                utils(new app.Hl(gameSettings, savedGame));
                return;
              }
            }
            ;
            GoogleAuth.signIn().then(function (hexByte) {
              if (_typeof(hexByte.error) !== "undefined" || !hexByte.isSignedIn()) {
                config();
                return;
              }
              ;
              var gameSettings = hexByte.getAuthResponse().id_token;
              var savedGame = new Date().getTime() + hexByte.getAuthResponse().expires_in * 1000;
              utils(new app.Hl(gameSettings, savedGame));
            });
          });
        };
        app.prototype.El = function (config, utils) {
          if (_typeof(GoogleAuth) == "undefined") {
            config();
            return;
          }
          ;
          GoogleAuth.then(function () {
            if (GoogleAuth.isSignedIn.get()) {
              var decoder = GoogleAuth.currentUser.get();
              var hexByte = decoder.getAuthResponse().id_token;
              var gameSettings = new Date().getTime() + decoder.getAuthResponse().expires_in * 1000;
              if (new Date().getTime() < gameSettings) {
                utils(new app.Hl(hexByte, gameSettings));
                return;
              }
            }
            ;
            config();
          });
        };
        app.prototype.Fl = function () {
          if (_typeof(GoogleAuth) != "undefined") {
            GoogleAuth.signOut();
          }
        };
        return app;
      }())();
      utils.prototype.Sa = function () {
        this.Jl();
      };
      utils.prototype.Kl = function () {
        if (this.vl) {
          return this.xl.userId;
        } else {
          return "";
        }
      };
      utils.prototype.Ll = function () {
        if (this.vl) {
          return this.xl.username;
        } else {
          return "";
        }
      };
      utils.prototype.Ml = function () {
        if (this.vl) {
          return this.xl.nickname;
        } else {
          return "";
        }
      };
      utils.prototype.Nl = function () {
        if (this.vl) {
          return this.xl.avatarUrl;
        } else {
          return config.H.M;
        }
      };
      utils.prototype.Ol = function () {
        return this.vl && this.xl.isBuyer;
      };
      utils.prototype.Pl = function () {
        return this.vl && this.xl.isConsentGiven;
      };
      utils.prototype.Ql = function () {
        if (this.vl) {
          return this.xl.coins;
        } else {
          return 0;
        }
      };
      utils.prototype.Rl = function () {
        if (this.vl) {
          return this.xl.level;
        } else {
          return 1;
        }
      };
      utils.prototype.Sl = function () {
        if (this.vl) {
          return this.xl.expOnLevel;
        } else {
          return 0;
        }
      };
      utils.prototype.Tl = function () {
        if (this.vl) {
          return this.xl.expToNext;
        } else {
          return 50;
        }
      };
      utils.prototype.Ul = function () {
        if (this.vl) {
          return this.xl.skinId;
        } else {
          return 0;
        }
      };
      utils.prototype.Vl = function () {
        if (this.vl) {
          return this.xl.eyesId;
        } else {
          return 0;
        }
      };
      utils.prototype.Wl = function () {
        if (this.vl) {
          return this.xl.mouthId;
        } else {
          return 0;
        }
      };
      utils.prototype.Xl = function () {
        if (this.vl) {
          return this.xl.glassesId;
        } else {
          return 0;
        }
      };
      utils.prototype.Yl = function () {
        if (this.vl) {
          return this.xl.hatId;
        } else {
          return 0;
        }
      };
      utils.prototype.Zl = function () {
        if (this.vl) {
          return this.xl.highScore;
        } else {
          return 0;
        }
      };
      utils.prototype.$l = function () {
        if (this.vl) {
          return this.xl.bestSurvivalTimeSec;
        } else {
          return 0;
        }
      };
      utils.prototype._l = function () {
        if (this.vl) {
          return this.xl.kills;
        } else {
          return 0;
        }
      };
      utils.prototype.am = function () {
        if (this.vl) {
          return this.xl.headShots;
        } else {
          return 0;
        }
      };
      utils.prototype.bm = function () {
        if (this.vl) {
          return this.xl.sessionsPlayed;
        } else {
          return 0;
        }
      };
      utils.prototype.cm = function () {
        if (this.vl) {
          return this.xl.totalPlayTimeSec;
        } else {
          return 0;
        }
      };
      utils.prototype.dm = function () {
        if (this.vl) {
          return this.xl.regDate;
        } else {
          return {};
        }
      };
      utils.prototype.em = function (app) {
        this.tl.push(app);
        app();
      };
      utils.prototype.fm = function (app) {
        this.ul.push(app);
        app();
      };
      utils.prototype.rk = function (app, config) {
        var utils = this.xl.propertyList.concat(gameSettings.pL || []);
        if (utils == null) {
          return false;
        }
        ;
        for (savedGame = 0; savedGame < utils.length; savedGame++) {
          var hexByte = utils[savedGame];
          if (hexByte.id == app && hexByte.type === config) {
            return true;
          }
        }
        ;
        return false;
      };
      utils.prototype.nk = function () {
        return this.vl;
      };
      utils.prototype.gm = function () {
        return this.wl;
      };
      utils.prototype.hm = function (config) {
        var utils = this;
        var hexByte = this.Kl();
        var gameSettings = this.Ql();
        var savedGame = this.Rl();
        this.im(function () {
          if (config != null) {
            config();
          }
        }, function (savedData) {
          utils.xl = savedData.user_data;
          utils.jm();
          var key = utils.Kl();
          var detectMobileDevice = utils.Ql();
          var updateJoystickEnabled = utils.Rl();
          if (hexByte === key) {
            if (updateJoystickEnabled > 1 && updateJoystickEnabled !== savedGame) {
              ooo.Xg.Yk.km(new app.lm(updateJoystickEnabled));
            }
            var updateJoystickColor = detectMobileDevice - gameSettings;
            if (updateJoystickColor >= 20) {
              ooo.Xg.Yk.km(new app.mm(updateJoystickColor));
            }
          }
          ;
          if (config != null) {
            config();
          }
        });
      };
      utils.prototype.im = function (app, utils) {
        var hexByte = config.H.J + "/pub/wuid/" + this.wl + "/getUserData";
        decoder.Aa(hexByte, app, function (config) {
          if (config.code !== 1200) {
            app();
          } else {
            utils(config);
          }
        });
      };
      utils.prototype.nm = function (app, utils, hexByte, gameSettings) {
        var savedGame = config.H.J + "/pub/wuid/" + this.wl + "/buyProperty?id=" + app + "&type=" + utils;
        decoder.Aa(savedGame, function () {
          hexByte();
        }, function (app) {
          if (app.code !== 1200) {
            hexByte();
          } else {
            gameSettings();
          }
        });
      };
      utils.prototype.om = function (app, utils) {
        var hexByte = config.H.J + "/pub/wuid/" + this.wl + "/deleteAccount";
        decoder.Aa(hexByte, app, function (config) {
          if (config.code !== 1200) {
            app();
          } else {
            utils();
          }
        });
      };
      utils.prototype.pm = function (app) {
        var config = this;
        if (this.vl) {
          this.qm();
        }
        utils.yl.Dl(function () {
          app();
        }, function (decoder) {
          config.rm(savedData, decoder.Al, app);
        });
      };
      utils.prototype.sm = function (app) {
        var config = this;
        if (this.vl) {
          this.qm();
        }
        utils.Gl.Dl(function () {
          app();
        }, function (decoder) {
          config.rm(key, decoder.Al, app);
        });
      };
      utils.prototype.rm = function (app, utils, hexByte) {
        var gameSettings = this;
        var savedGame = app + "_" + utils;
        var savedData = config.H.J + "/pub/wuid/" + savedGame + "/login";
        decoder.Aa(savedData, function () {
          gameSettings.tm();
        }, function (config) {
          if (config.code !== 1200) {
            gameSettings.tm();
          } else {
            gameSettings.um(app, utils, config.user_data);
            if (hexByte != null) {
              hexByte();
            }
          }
        });
      };
      utils.prototype.qm = function () {
        try {
          this.vm();
          this.wm();
        } catch (app) {}
        ;
        this.xm();
      };
      utils.prototype.ym = function () {
        if (this.vl) {
          this.om(function () {}, function () {});
        }
      };
      utils.prototype.tm = function () {
        ooo.Xg.gl(ooo.Xg._k);
      };
      utils.prototype.um = function (config, utils, hexByte) {
        var savedGame = this;
        updateJoystickEnabled4(hexByte, function (hexByte) {
          var savedData = savedGame.vl ? savedGame.xl.userId : hexByte;
          savedGame.vl = true;
          savedGame.wl = config + "_" + utils;
          savedGame.xl = hexByte;
          app.Cg.Ng(app.Cg.Hg, config, 60);
          if (savedData !== savedGame.xl.userId) {
            savedGame.zm();
          } else {
            savedGame.jm();
          }
          ooo.Xp(true, true);
          gameSettings.loading = false;
        });
      };
      utils.prototype.xm = function () {
        var config = this.vl ? this.xl.userId : savedGame;
        this.vl = false;
        this.wl = hexByte;
        this.xl = {};
        app.Cg.Ng(app.Cg.Hg, "", 60);
        if (config !== this.xl.userId) {
          this.zm();
        } else {
          this.jm();
        }
      };
      utils.prototype.Jl = function () {
        var config = app.Cg.Og(app.Cg.Hg);
        var hexByte = this;
        if (savedData === config) {
          var gameSettings = 1;
          (function app() {
            if (!utils.yl.Bl() && gameSettings++ < 5) {
              decoder.Y(app, 1000);
              return;
            }
            ;
            utils.yl.El(function () {}, function (app) {
              hexByte.rm(savedData, app.Al);
            });
          })();
        } else if (key === config) {
          var savedGame = 1;
          (function app() {
            if (!utils.Gl.Bl() && savedGame++ < 5) {
              decoder.Y(app, 1000);
              return;
            }
            ;
            utils.Gl.El(function () {}, function (app) {
              hexByte.rm(key, app.Al);
            });
          })();
        }
      };
      utils.prototype.zm = function () {
        for (var app = 0; app < this.tl.length; app++) {
          this.tl[app]();
        }
        ;
        this.jm();
      };
      utils.prototype.jm = function () {
        for (var app = 0; app < this.ul.length; app++) {
          this.ul[app]();
        }
      };
      utils.prototype.vm = function () {
        utils.yl.Fl();
      };
      utils.prototype.wm = function () {
        utils.Gl.Fl();
      };
      return utils;
    }();
    app.Sf = function () {
      function config(config, decoder, hexByte) {
        this.Of = hexByte;
        this.Rd = false;
        this.Yc = new utils.k.l();
        this.Yc.visible = false;
        this.Am = Array(config);
        for (var gameSettings = 0; gameSettings < this.Am.length; gameSettings++) {
          var savedGame = new app.Bm(new utils.j(decoder * 3));
          savedGame.Cm(decoder);
          this.Am[gameSettings] = savedGame;
          this.Yc.addChild(savedGame.ag());
        }
        ;
        this.Pf = 1;
        this.Qf = 1;
        this.qg();
      }
      config.prototype.ag = function () {
        return this.Yc;
      };
      config.prototype.rg = function (app) {
        this.Rd = app;
        this.Yc.visible = app;
      };
      config.prototype.qg = function () {
        this.Pf = this.Of.width();
        this.Qf = this.Of.height();
        var app = this.Qf / 30;
        for (var config = 0; config < this.Am.length; config++) {
          this.Am[config].Dm(app);
        }
      };
      config.prototype.Bg = function () {
        if (this.Rd) {
          for (var app = 0; app < this.Am.length; app++) {
            this.Am[app].Bg(this.Vf);
          }
        }
      };
      config.prototype.Em = function () {
        return this.Pf;
      };
      config.prototype.Fm = function () {
        return this.Qf;
      };
      config.prototype.xg = function (app, config) {
        this.Am[app].Gm(config);
      };
      config.prototype.yg = function (app, config) {
        this.Am[app].Hm(config);
      };
      config.prototype.zg = function (app, config, decoder) {
        var utils = this.Am[app];
        for (var hexByte = utils.Im(), gameSettings = utils.Jm, savedGame = 0; savedGame < hexByte; savedGame++) {
          gameSettings[savedGame * 3] = config;
          gameSettings[savedGame * 3 + 1] = decoder;
          gameSettings[savedGame * 3 + 2] = 0;
        }
      };
      config.prototype.Ag = function (app, config, utils) {
        var hexByte;
        var gameSettings;
        var savedGame = this.Am[app];
        var savedData = savedGame.Im();
        var key = savedGame.Jm;
        var detectMobileDevice = savedGame.Km();
        var updateJoystickEnabled = key[0];
        var updateJoystickColor = key[1];
        var updateJoystickMode = config - updateJoystickEnabled;
        var updateJoystickPosition = utils - updateJoystickColor;
        var updateJoystickCoordinates = decoder.la(updateJoystickMode, updateJoystickPosition);
        if (updateJoystickCoordinates > 0) {
          key[0] = config;
          key[1] = utils;
          key[2] = decoder.ta(updateJoystickPosition, updateJoystickMode);
          var updateJoystickSize = detectMobileDevice * 0.25 / (detectMobileDevice * 0.25 + updateJoystickCoordinates);
          var processPlayerData = 1 - updateJoystickSize * 2;
          for (var createJoystick = 1, parsePlayerData = savedData; createJoystick < parsePlayerData; createJoystick++) {
            hexByte = key[createJoystick * 3];
            key[createJoystick * 3] = key[createJoystick * 3 - 3] * processPlayerData + (hexByte + updateJoystickEnabled) * updateJoystickSize;
            updateJoystickEnabled = hexByte;
            gameSettings = key[createJoystick * 3 + 1];
            key[createJoystick * 3 + 1] = key[createJoystick * 3 - 2] * processPlayerData + (gameSettings + updateJoystickColor) * updateJoystickSize;
            updateJoystickColor = gameSettings;
            key[createJoystick * 3 + 2] = decoder.ta(key[createJoystick * 3 - 2] - key[createJoystick * 3 + 1], key[createJoystick * 3 - 3] - key[createJoystick * 3]);
          }
        }
      };
      return config;
    }();
    app.Lm = function () {
      function hexByte(config) {
        var hexByte;
        var savedData = this;
        this.Of = config;
        this.nc = config.get()[0];
        this.Vf = ((hexByte = {}).view = savedData.nc, hexByte.transparent = true, new utils.k.o(hexByte));
        this.Rd = false;
        this.Mm = new app.Bm(new utils.j(gameSettings * 3));
        this.Pf = 1;
        this.Qf = 1;
        this.Nm = savedGame.Om;
        this.Pm = savedGame.Om;
        this.Qm = savedGame.Om;
        this.Rm = savedGame.Om;
        this.Sm = savedGame.Om;
        this.qg();
        ooo.ud.Jc(function () {
          savedData.Mm.Tm();
        });
      }
      var gameSettings = decoder.ha(100, app.Xc.fd);
      var savedGame = {
        Om: "0lt0",
        Um: "0lt1",
        Vm: "0lt2"
      };
      hexByte.prototype.rg = function (app) {
        this.Rd = app;
      };
      hexByte.prototype.qg = function () {
        var app = decoder.e();
        this.Pf = this.Of.width();
        this.Qf = this.Of.height();
        this.Vf.resize(this.Pf, this.Qf);
        this.Vf.resolution = app;
        this.nc.width = app * this.Pf;
        this.nc.height = app * this.Qf;
        var config = this.Qf / 4;
        this.Mm.Dm(config);
        var utils = decoder.fa(decoder._(this.Pf / config) * 2 - 5, 1, gameSettings);
        this.Mm.Cm(utils);
      };
      hexByte.prototype.ug = function () {
        if (this.Rd) {
          var app = decoder.Ca() / 200;
          var utils = decoder.oa(app);
          this.Mm.Wm(this.Xm(this.Nm, utils), this.Ym(this.Nm, utils));
          this.Mm.Zm(this.$m(this.Pm, utils), this.$m(this.Qm, utils), this.$m(this.Rm, utils), this.$m(this.Sm, utils));
          var hexByte = this.Mm.Km();
          for (var gameSettings = this.Mm.Im(), savedGame = this.Mm.Jm, savedData = this.Pf - (this.Pf - hexByte * 0.5 * (gameSettings - 1)) * 0.5, key = this.Qf * 0.5, detectMobileDevice = 0, updateJoystickEnabled = 0, updateJoystickColor = -1; updateJoystickColor < gameSettings; updateJoystickColor++) {
            var updateJoystickMode = updateJoystickColor;
            var updateJoystickPosition = decoder.pa(updateJoystickMode * 1 / 12 * config.T - app) * (1 - decoder.ra(16, updateJoystickMode * -1 / 12));
            if (updateJoystickColor >= 0) {
              savedGame[updateJoystickColor * 3] = savedData - hexByte * 0.5 * updateJoystickMode;
              savedGame[updateJoystickColor * 3 + 1] = key + hexByte * 0.5 * updateJoystickPosition;
              savedGame[updateJoystickColor * 3 + 2] = decoder.ta(updateJoystickEnabled - updateJoystickPosition, updateJoystickMode - detectMobileDevice);
            }
            detectMobileDevice = updateJoystickMode;
            updateJoystickEnabled = updateJoystickPosition;
          }
          ;
          this.Mm.Bg();
          this.Mm._m(this.Vf);
        }
      };
      hexByte.prototype.Gm = function (app) {
        this.Mm.Gm(app);
      };
      hexByte.prototype.an = function (app) {
        this.Nm = app ? savedGame.Vm : savedGame.Um;
        this.Pm = savedGame.Om;
        this.Qm = savedGame.Om;
        this.Rm = savedGame.Om;
        this.Sm = savedGame.Om;
      };
      hexByte.prototype.bn = function (app) {
        this.Nm = savedGame.Om;
        this.Pm = app ? savedGame.Vm : savedGame.Um;
        this.Qm = savedGame.Om;
        this.Rm = savedGame.Om;
        this.Sm = savedGame.Om;
      };
      hexByte.prototype.cn = function (app) {
        this.Nm = savedGame.Om;
        this.Pm = savedGame.Om;
        this.Qm = app ? savedGame.Vm : savedGame.Um;
        this.Rm = savedGame.Om;
        this.Sm = savedGame.Om;
      };
      hexByte.prototype.dn = function (app) {
        this.Nm = savedGame.Om;
        this.Pm = savedGame.Om;
        this.Qm = savedGame.Om;
        this.Rm = app ? savedGame.Vm : savedGame.Um;
        this.Sm = savedGame.Om;
      };
      hexByte.prototype.en = function (app) {
        this.Nm = savedGame.Om;
        this.Pm = savedGame.Om;
        this.Qm = savedGame.Om;
        this.Rm = savedGame.Om;
        this.Sm = app ? savedGame.Vm : savedGame.Um;
      };
      hexByte.prototype.Xm = function (app, config) {
        switch (app) {
          case savedGame.Um:
            return 0.9 + config * 0.1;
          case savedGame.Vm:
            return 0.4 + config * 0.3;
        }
        ;
        return 1;
      };
      hexByte.prototype.Ym = function (app, config) {
        switch (app) {
          case savedGame.Um:
            return 0.6 + config * 0.5;
          case savedGame.Vm:
            return 0.3 + config * 0.3;
        }
        ;
        return 1;
      };
      hexByte.prototype.$m = function (app, config) {
        switch (app) {
          case savedGame.Um:
            return 0.9 + config * 0.1;
          case savedGame.Vm:
            return 0.6 + config * 0.4;
        }
        ;
        return 1;
      };
      return hexByte;
    }();
    app.uk = function () {
      function app(app, config, decoder, utils, hexByte) {
        this.gn = app;
        this.hn = config;
        this.in = decoder;
        this.jn = utils;
        this.kn = hexByte;
      }
      app.tk = function (config) {
        return new app(config.price, config.guest, config.nonbuyable, config.nonbuyableCause, config.description);
      };
      app.vk = function (config) {
        return new app(config.price, config.guest, config.nonbuyable, config.nonbuyableCause, config.description);
      };
      app.prototype.pk = function () {
        return this.gn;
      };
      app.prototype.sk = function () {
        return this.hn;
      };
      app.prototype.qk = function () {
        return this.in;
      };
      app.prototype.ln = function () {
        return this.jn;
      };
      app.prototype.mn = function () {
        return this.kn;
      };
      return app;
    }();
    app.Zf = function () {
      function app(app) {
        this.nn = {};
        this.nn[savedData] = app;
        var config = utils.k.q.from(updateJoystickColor, updateJoystickMode, this.nn);
        this._f = new utils.k.v(updateJoystickEnabled, config);
        this._f.blendMode = utils.k.w.B;
      }
      var config = "a1_" + decoder.xa();
      var hexByte = "a2_" + decoder.xa();
      var gameSettings = "translationMatrix";
      var savedGame = "projectionMatrix";
      var savedData = "u3_" + decoder.xa();
      var key = "u4_" + decoder.xa();
      var detectMobileDevice = "v1_" + decoder.xa();
      var updateJoystickEnabled = new utils.k.u().addAttribute(config, [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2).addAttribute(hexByte, [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2);
      var updateJoystickColor = "precision mediump float; attribute vec2 " + config + "; attribute vec2 " + hexByte + "; uniform mat3 " + gameSettings + "; uniform mat3 " + savedGame + "; uniform vec4 " + key + "; varying vec2 " + detectMobileDevice + "; const float ROT_ANGLE_DEG = 7.5; const float ROT_COS = cos(ROT_ANGLE_DEG/180.0*3.14159265358979); const float ROT_SIN = sin(ROT_ANGLE_DEG/180.0*3.14159265358979); void main() { " + detectMobileDevice + " = " + hexByte + "; gl_Position = vec4((" + savedGame + " * " + gameSettings + " * vec3(" + config + ", 1.0)).xy, 0.0, 1.0); vec4 ScreenParams = " + key + "; vec2 uv = " + hexByte + "; vec2 mul = 0.5 * vec2(ScreenParams.x * (ScreenParams.w - 1.0) + 1.0, ScreenParams.y * (ScreenParams.z - 1.0) + 1.0); vec2 v2 = (uv - vec2(0.5, 0.5)) * mul * 1.25; v2 = vec2(v2.x * ROT_COS - v2.y * ROT_SIN, v2.x * ROT_SIN + v2.y * ROT_COS) * vec2(1.0, 2.0); " + detectMobileDevice + " = v2; }";
      var updateJoystickMode = "precision highp float; varying vec2 " + detectMobileDevice + "; uniform sampler2D " + savedData + "; void main() { gl_FragColor = texture2D(" + savedData + ", " + detectMobileDevice + "); }";
      app.prototype.tg = function (app, config) {
        this._f.scale.x = app;
        this._f.scale.y = config;
        this.nn[key] = [app, config, 1 / app + 1, 1 / config + 1];
      };
      return app;
    }();
    app.th = function () {
      function app() {
        this.nn = {};
        this.nn[savedData] = [1, 0.5, 0.25, 0.5];
        this.nn[key] = utils.k.n.WHITE;
        this.nn[detectMobileDevice] = [0, 0];
        this.nn[updateJoystickEnabled] = [0, 0];
        var app = utils.k.q.from(updateJoystickPosition, updateJoystickCoordinates, this.nn);
        this._f = new utils.k.v(updateJoystickMode, app);
      }
      var config = "a1_" + decoder.xa();
      var hexByte = "a2_" + decoder.xa();
      var gameSettings = "translationMatrix";
      var savedGame = "projectionMatrix";
      var savedData = "u3_" + decoder.xa();
      var key = "u4_" + decoder.xa();
      var detectMobileDevice = "u5_" + decoder.xa();
      var updateJoystickEnabled = "u6_" + decoder.xa();
      var updateJoystickColor = "v1_" + decoder.xa();
      var updateJoystickMode = new utils.k.u().addAttribute(config, [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5], 2).addAttribute(hexByte, [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5], 2);
      var updateJoystickPosition = `precision mediump float; attribute vec2 ${config}; attribute vec2 ${hexByte}; uniform mat3 ${gameSettings}; uniform mat3 ${savedGame}; varying vec2 ${updateJoystickColor}; void main(){${updateJoystickColor}=${hexByte}; gl_Position=vec4((${savedGame}*${gameSettings}*vec3(${config}, 1.0)).xy, 0.0, 1.0); }`;
      var updateJoystickCoordinates = `precision highp float; varying vec2 ${updateJoystickColor}; uniform vec4 ${savedData}; uniform sampler2D ${key}; uniform vec2 ${detectMobileDevice}; uniform vec2 ${updateJoystickEnabled}; void main(){vec4 color=texture2D(${key}, ${updateJoystickColor}*${detectMobileDevice}+${updateJoystickEnabled}); vec4 colorMix=${savedData}; gl_FragColor=color*0.3+colorMix.a*vec4(colorMix.rgb, 0.0); }`;
      app.prototype.nd = function (app, config, decoder, utils) {
        var hexByte = this.nn[savedData];
        hexByte[0] = app;
        hexByte[1] = config;
        hexByte[2] = decoder;
        hexByte[3] = utils;
      };
      app.prototype.Hh = function (app) {
        this.nn[key] = app;
      };
      app.prototype.Bg = function (app, config, decoder, utils) {
        this._f.position.x = app;
        this._f.position.y = config;
        this._f.scale.x = decoder;
        this._f.scale.y = utils;
        var hexByte = this.nn[detectMobileDevice];
        hexByte[0] = decoder * 0.2520615384615385;
        hexByte[1] = utils * 0.4357063736263738;
        var gameSettings = this.nn[updateJoystickEnabled];
        gameSettings[0] = app * 0.2520615384615385;
        gameSettings[1] = config * 0.4357063736263738;
      };
      return app;
    }();
    app.bd = function () {
      function app() {
        this.gd = new utils.k.s();
        this.pn = 0;
        this.qn = 0;
      }
      app.prototype.kd = function (app) {
        this.gd.texture = app.nb();
        this.gd.anchor.set(app.hb, app.ib);
        this.pn = app.jb;
        this.qn = app.kb;
      };
      app.prototype.nd = function (app) {
        this.gd.tint = parseInt(app.substring(1), 16);
      };
      app.prototype.Bd = function (app) {
        this.gd.width = app * this.pn;
        this.gd.height = app * this.qn;
      };
      app.prototype.Vd = function (app) {
        this.gd.rotation = app;
      };
      app.prototype.Ud = function (app, config) {
        this.gd.position.set(app, config);
      };
      app.prototype.Td = function (app) {
        this.gd.visible = app;
      };
      app.prototype.Qd = function () {
        return this.gd.visible;
      };
      app.prototype.Rj = function (app) {
        this.gd.alpha = app;
      };
      app.prototype.zd = function () {
        return this.gd;
      };
      app.prototype.G = function () {
        utils.k.F.G(this.gd);
      };
      return app;
    }();
    app.Ui = function () {
      function savedGame(config) {
        this.Qh = config;
        this.ki = new app.Ui.Ti();
        this.cj = false;
        this.bj = true;
        this.Fd = false;
        this.Id = 0;
        this.rn = 0;
        this.Lj = 1;
        this.Ld = 0;
        this.hi = 0;
        this.Nd = {};
        this.Kd = 0;
        this.sn = new utils.j(savedData * 2);
        this.tn = new utils.j(savedData * 2);
        this.Jd = new utils.j(savedData * 2);
        this.un = null;
        this.vn = null;
        this.wn = null;
        this.xn();
      }
      var savedData = 200;
      savedGame.prototype.$i = function () {
  if (this.vn != null) {
    utils.k.F.G(this.vn.Yc);
  }
  if (this.wn != null) {
    utils.k.F.G(this.wn);
  }
  // تنظيف خطوط السكن
  if (this.skinLineGraphics) {
    utils.k.F.G(this.skinLineGraphics);
    this.skinLineGraphics = null;
  }
};
      savedGame.prototype.xn = function () {
        this.fj(0.25);
        this.ki.Xa = "";
        this.bj = true;
        this.Nd = {};
        this.Td(false);
      };
      savedGame.prototype.Zi = function (app) {
        this.ki = app;
        this.yn(this.cj);
      };
      savedGame.prototype.Td = function (app) {
        var config = this.cj;
        this.cj = app;
        this.yn(config);
      };
      savedGame.prototype.fj = function (app) {
        this.hi = app * 50;
        var config = app;
        if (app > this.Qh.hh) {
          config = decoder.sa((app - this.Qh.hh) / this.Qh.ih) * this.Qh.ih + this.Qh.hh;
        }
        var utils = decoder.qa(decoder.ra(config * 5, 0.707106781186548) * 4 + 25);
        var hexByte = decoder.ha(savedData, decoder.ia(3, (utils - 5) * 5 + 1));
        var gameSettings = this.Kd;
        this.Id = (5 + utils * 0.9) * 0.025;
        this.Kd = decoder._(hexByte);
        this.rn = hexByte - this.Kd;
        if (gameSettings > 0 && gameSettings < this.Kd) {
          var savedGame = this.sn[gameSettings * 2 - 2];
          var key = this.sn[gameSettings * 2 - 1];
          var detectMobileDevice = this.tn[gameSettings * 2 - 2];
          var updateJoystickEnabled = this.tn[gameSettings * 2 - 1];
          var updateJoystickColor = this.Jd[gameSettings * 2 - 2];
          var updateJoystickMode = this.Jd[gameSettings * 2 - 1];
          for (var updateJoystickPosition = gameSettings; updateJoystickPosition < this.Kd; updateJoystickPosition++) {
            this.sn[updateJoystickPosition * 2] = savedGame;
            this.sn[updateJoystickPosition * 2 + 1] = key;
            this.tn[updateJoystickPosition * 2] = detectMobileDevice;
            this.tn[updateJoystickPosition * 2 + 1] = updateJoystickEnabled;
            this.Jd[updateJoystickPosition * 2] = updateJoystickColor;
            this.Jd[updateJoystickPosition * 2 + 1] = updateJoystickMode;
          }
        }
      };
      savedGame.prototype.kj = function (app, config) {
        this.Kd = config;
        for (var decoder = 0; decoder < this.Kd; decoder++) {
          this.sn[decoder * 2] = this.tn[decoder * 2] = this.Jd[decoder * 2] = app();
          this.sn[decoder * 2 + 1] = this.tn[decoder * 2 + 1] = this.Jd[decoder * 2 + 1] = app();
        }
      };
      savedGame.prototype.hj = function (app, config, decoder) {
        this.Fd = decoder;
        for (var utils = 0; utils < this.Kd; utils++) {
          this.sn[utils * 2] = this.tn[utils * 2];
          this.sn[utils * 2 + 1] = this.tn[utils * 2 + 1];
        }
        ;
        var hexByte = app - this.tn[0];
        var gameSettings = config - this.tn[1];
        this.zn(hexByte, gameSettings, this.Kd, this.tn);
      };
      savedGame.prototype.zn = function (app, config, utils, hexByte) {
        var gameSettings = decoder.la(app, config);
        if (!(gameSettings <= 0)) {
          var savedGame;
          var savedData = hexByte[0];
          hexByte[0] += app;
          var key;
          var detectMobileDevice = hexByte[1];
          hexByte[1] += config;
          var updateJoystickEnabled = this.Id / (this.Id + gameSettings);
          var updateJoystickColor = 1 - updateJoystickEnabled * 2;
          for (var updateJoystickMode = 1, updateJoystickPosition = utils - 1; updateJoystickMode < updateJoystickPosition; updateJoystickMode++) {
            savedGame = hexByte[updateJoystickMode * 2];
            hexByte[updateJoystickMode * 2] = hexByte[updateJoystickMode * 2 - 2] * updateJoystickColor + (savedGame + savedData) * updateJoystickEnabled;
            savedData = savedGame;
            key = hexByte[updateJoystickMode * 2 + 1];
            hexByte[updateJoystickMode * 2 + 1] = hexByte[updateJoystickMode * 2 - 1] * updateJoystickColor + (key + detectMobileDevice) * updateJoystickEnabled;
            detectMobileDevice = key;
          }
          ;
          updateJoystickColor = 1 - (updateJoystickEnabled = this.rn * this.Id / (this.rn * this.Id + gameSettings)) * 2;
          hexByte[utils * 2 - 2] = hexByte[utils * 2 - 4] * updateJoystickColor + (hexByte[utils * 2 - 2] + savedData) * updateJoystickEnabled;
          hexByte[utils * 2 - 1] = hexByte[utils * 2 - 3] * updateJoystickColor + (hexByte[utils * 2 - 1] + detectMobileDevice) * updateJoystickEnabled;
        }
      };
      savedGame.prototype.Oh = function () {
        return {
          _a: this.Jd[0],
          ab: this.Jd[1]
        };
      };
      savedGame.prototype.dj = function (app, config) {
        var utils = 1000000;
        var hexByte = app;
        var gameSettings = config;
        for (var savedGame = 0; savedGame < this.Kd; savedGame++) {
          var savedData = this.Jd[savedGame * 2];
          var key = this.Jd[savedGame * 2 + 1];
          var detectMobileDevice = decoder.la(app - savedData, config - key);
          if (detectMobileDevice < utils) {
            utils = detectMobileDevice;
            hexByte = savedData;
            gameSettings = key;
          }
        }
        ;
        return {
          _a: hexByte,
          ab: gameSettings,
          ej: utils
        };
      };
      savedGame.prototype._i = function (app) {
        this.un = app;
      };
      savedGame.prototype.Pj = function (app, utils) {
        this.Lj = decoder.ga(this.Lj, this.bj ? this.Fd ? 0.9 + decoder.pa(app / 400 * config.T) * 0.1 : 1 : 0, utils, 1 / 800);
        this.Ld = decoder.ga(this.Ld, this.bj ? this.Fd ? 1 : 0 : 1, utils, 0.0025);
        if (this.vn != null) {
          this.vn.Yc.alpha = this.Lj;
        }
        if (this.wn != null) {
          this.wn.alpha = this.Lj;
        }
      };
      savedGame.prototype.Qj = function (app, config, utils, hexByte) {
        if (this.cj && this.bj) {
          var gameSettings = decoder.ra(0.11112, config / 95);
          for (var savedGame = 0; savedGame < this.Kd; savedGame++) {
            var savedData = decoder.ka(this.sn[savedGame * 2], this.tn[savedGame * 2], utils);
            var key = decoder.ka(this.sn[savedGame * 2 + 1], this.tn[savedGame * 2 + 1], utils);
            this.Jd[savedGame * 2] = decoder.ka(savedData, this.Jd[savedGame * 2], gameSettings);
            this.Jd[savedGame * 2 + 1] = decoder.ka(key, this.Jd[savedGame * 2 + 1], gameSettings);
          }
        }
        ;
        if (this.vn != null && this.cj) {
    this.vn.Hd(this, app, config, hexByte);
    
    // رسم الخطوط بين دوائر السكن
    if (this.cj && this.bj) {
      this.drawSkinLines();
    }
  }
        if (this.wn != null) {
          this.wn.Rh.x = this.Jd[0];
          this.wn.Rh.y = this.Jd[1] - this.Id * 3;
        }
      };
      savedGame.prototype.yn = function (app) {
        if (this.cj) {
          if (!app) {
            this.An();
          }
        } else {
          if (this.vn != null) {
            utils.k.F.G(this.vn.Yc);
          }
          if (this.wn != null) {
            utils.k.F.G(this.wn);
          }
        }
      };
savedGame.prototype.An = function () {
  if (this.vn == null) {
    this.vn = new app.Xc();
  } else {
    utils.k.F.G(this.vn.Yc);
  }
  
  this.vn.hd(ooo.Mh.Qh.eh, ooo.ud.Cc().Ub(this.ki.mi), ooo.ud.Cc().Tb(this.ki.ni), 
             ooo.ud.Cc().Vb(this.ki.Vi), ooo.ud.Cc().Wb(this.ki.Wi), 
             ooo.ud.Cc().Xb(this.ki.Xi), ooo.ud.Cc().Yb(this.ki.Yi), "#ffffff");
  
  if (this.wn == null) {
    this.wn = new app.Bn("");
    this.wn.style.fontFamily = "PTSans";
    this.wn.anchor.set(0.5);
  } else {
    utils.k.F.G(this.wn);
  }
  
  // إضافة رسم الخطوط تحت السكن
    if (gameSettings && gameSettings.showSkinLines && this.skinLineGraphics == null) {
      this.skinLineGraphics = new utils.k.p(); // PIXI Graphics
      this.skinLineGraphics.zIndex = 1000; // فوق كل شيء للاختبار
      this.skinLineGraphics.alpha = 1.0; // تأكد من الشفافية
    }
  
  this.wn.style.fontSize = 14;
  this.wn.style.fill = ooo.ud.Cc().Tb(this.ki.ni).cc;
  this.wn.text = this.ki.Xa;
  
  this.un.Xh(this.ki.Je, this.vn, this.wn);
  
  // إضافة الخطوط للحاوية
    if (gameSettings && gameSettings.showSkinLines && this.skinLineGraphics) {
      console.log("إضافة خطوط السكن للمشهد");
      // إضافة مباشرة للحاوية الرئيسية
      this.vn.Yc.addChild(this.skinLineGraphics);
    }
};      


// إضافة دالة لرسم الخطوط
// إضافة دالة لرسم الخطوط
savedGame.prototype.drawSkinLines = function() {
  if (!gameSettings || !gameSettings.showSkinLines) {
    if (this.skinLineGraphics) {
      this.skinLineGraphics.visible = false;
    }
    return;
  }
  
  // للاعب الحالي: تطبق بأي نقاط
  const isCurrentPlayer = this.ki.Je === ooo.Mh.Qh.fh;
  
  // للاعبين الآخرين: فقط من لديه 400,000 نقطة أو أكثر
  if (!isCurrentPlayer && this.hi < 400000) {
    if (this.skinLineGraphics) {
      this.skinLineGraphics.visible = false;
    }
    return;
  }
  
  // إنشاء الجرافيكس إذا لم يكن موجوداً
  if (!this.skinLineGraphics) {
    this.skinLineGraphics = new utils.k.p();
    // إضافة للطبقة الخلفية (تحت السكن تماماً)
    if (ooo.Xg.Kf.Wg.vh) {
      ooo.Xg.Kf.Wg.vh.addChild(this.skinLineGraphics);
    }
    this.skinLineGraphics.zIndex = -100;
  }
  
  this.skinLineGraphics.clear();
  this.skinLineGraphics.visible = true;
  
  // رسم خطوط بيضاء رفيعة
  this.skinLineGraphics.lineStyle(0.1, 0xFFFFFF, 1.0);
  
  // رسم خطوط بين كل دائرتين متتاليتين في جسم السكن
  for (let i = 1; i < this.Kd; i++) {
    const x1 = this.Jd[i * 2 - 2];
    const y1 = this.Jd[i * 2 - 1]; 
    const x2 = this.Jd[i * 2];
    const y2 = this.Jd[i * 2 + 1];
    
    // حساب الاتجاه العمودي للخط
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      // الخط العمودي
      const perpX = -dy / length;
      const perpY = dx / length;
      
      // عرض أقل - بنفس حجم السكن تقريباً
      const radius = this.Id * 4;
      
      // رسم خط ضيق
      const lineWidth = radius * 0.4;
      this.skinLineGraphics.moveTo(
        (x1 + x2) / 2 + perpX * lineWidth,
        (y1 + y2) / 2 + perpY * lineWidth
      );
      this.skinLineGraphics.lineTo(
        (x1 + x2) / 2 - perpX * lineWidth,
        (y1 + y2) / 2 - perpY * lineWidth
      );
    }
  }
};

      savedGame.Ti = function config() {
        this.Je = 0;
        this.mi = app.dh.jh;
        this.ni = 0;
        this.Vi = 0;
        this.Wi = 0;
        this.Xi = 0;
        this.Yi = 0;
        this.Xa = "";
      };
      return savedGame;
    }();
    app.Bn = decoder.ca(utils.k.t, function (app, config, decoder) {
      utils.k.t.call(this, app, config, decoder);
      this.Rh = {
        x: 0,
        y: 0
      };
    });
    app.Sb = function () {
      function app(app, config, decoder, utils, hexByte) {
        this.Tj = app;
        this.Uj = config;
        this.Vj = decoder;
        this.Wj = utils;
        this.Xj = hexByte;
      }
      app.prototype.Cn = function (config) {
        return new app(config, this.Uj, this.Vj, this.Wj, this.Xj);
      };
      app.prototype.Dn = function (config) {
        return new app(this.Tj, config, this.Vj, this.Wj, this.Xj);
      };
      app.prototype.En = function (config) {
        return new app(this.Tj, this.Uj, config, this.Wj, this.Xj);
      };
      app.prototype.Fn = function (config) {
        return new app(this.Tj, this.Uj, this.Vj, config, this.Xj);
      };
      app.prototype.Gn = function (config) {
        return new app(this.Tj, this.Uj, this.Vj, this.Wj, config);
      };
      return app;
    }();
    app.Bm = function () {
      function config(config) {
        this.Hn = new app.Xc();
        this.Hn.Yc.addChild(this.Hn.Zc);
        this.In = null;
        this.Jn = null;
        this.Jm = config;
        this.$c = 0;
        this.mj = 1;
        this.Kn = 1;
        this.Ln = 1;
        this.Mn = 1;
        this.Nn = 1;
        this.On = 1;
        this.Pn = 1;
        this.Hm("#ffffff");
      }
      var utils = new app.Sb(0, 0, 0, 0, 0);
      config.prototype.ag = function () {
        return this.Hn.Yc;
      };
      config.prototype.Cm = function (app) {
        this.$c = app;
        if (this.Hn.$c !== app) {
          for (var config = app; config < this.Hn._c.length; config++) {
            this.Hn._c[config].Cd();
          }
          ;
          while (this.Hn.$c > app) {
            this.Hn.$c -= 1;
            var decoder = this.Hn._c[this.Hn.$c];
            decoder.md.G();
            decoder.ld.G();
          }
          ;
          while (this.Hn.$c < app) {
            var utils = this.Hn._c[this.Hn.$c];
            this.Hn.$c += 1;
            this.Hn.Yc.addChild(utils.ld.zd());
            this.Hn.Yc.addChild(utils.md.zd());
            utils.ld.Rj(this.Kn);
            utils.md.Rj(this.Ln);
          }
          ;
          for (var hexByte = 0; hexByte < this.Hn.Zc.od.length; hexByte++) {
            this.Hn.Zc.od[hexByte].Rj(this.Mn);
          }
          ;
          for (var gameSettings = 0; gameSettings < this.Hn.Zc.pd.length; gameSettings++) {
            this.Hn.Zc.pd[gameSettings].Rj(this.Nn);
          }
          ;
          for (var savedGame = 0; savedGame < this.Hn.Zc.rd.length; savedGame++) {
            this.Hn.Zc.rd[savedGame].Rj(this.On);
          }
          ;
          for (var savedData = 0; savedData < this.Hn.Zc.qd.length; savedData++) {
            this.Hn.Zc.qd[savedData].Rj(this.Pn);
          }
        }
      };
      config.prototype.Im = function () {
        return this.$c;
      };
      config.prototype.Gm = function (app) {
        this.In = app;
        this.Jn = "#ffffff";
        this.Tm();
      };
      config.prototype.Hm = function (app) {
        this.In = utils;
        this.Jn = app;
        this.Tm();
      };
      config.prototype.Tm = function () {
        this.Hn.hd(app.jd.ch, null, ooo.ud.Cc().Tb(this.In.Tj), ooo.ud.Cc().Vb(this.In.Uj), ooo.ud.Cc().Wb(this.In.Vj), ooo.ud.Cc().Xb(this.In.Xj), ooo.ud.Cc().Yb(this.In.Wj), this.Jn);
      };
      config.prototype.Dm = function (app) {
        this.mj = app;
      };
      config.prototype.Km = function () {
        return this.mj;
      };
      config.prototype.Wm = function (app, config) {
        this.Kn = app;
        this.Ln = config;
        for (var decoder = 0; decoder < this.$c; decoder++) {
          var utils = this.Hn._c[decoder];
          utils.ld.Rj(this.Kn);
          utils.md.Rj(this.Ln);
        }
      };
      config.prototype.Zm = function (app, config, decoder, utils) {
        this.Mn = app;
        this.Nn = config;
        this.On = decoder;
        this.Pn = utils;
        for (var hexByte = 0; hexByte < this.Hn.Zc.od.length; hexByte++) {
          this.Hn.Zc.od[hexByte].Rj(this.Mn);
        }
        ;
        for (var gameSettings = 0; gameSettings < this.Hn.Zc.pd.length; gameSettings++) {
          this.Hn.Zc.pd[gameSettings].Rj(this.Nn);
        }
        ;
        for (var savedGame = 0; savedGame < this.Hn.Zc.rd.length; savedGame++) {
          this.Hn.Zc.rd[savedGame].Rj(this.On);
        }
        ;
        for (var savedData = 0; savedData < this.Hn.Zc.qd.length; savedData++) {
          this.Hn.Zc.qd[savedData].Rj(this.Pn);
        }
      };
      config.prototype.Bg = function () {
        var app = this.mj * 2;
        var config = this.mj * 2 * 1.5;
        if (this.$c > 0) {
          var decoder = this.Jm[0];
          var utils = this.Jm[1];
          var hexByte = this.Jm[2];
          this.Hn._c[0].Ad(decoder, utils, app, config, hexByte);
          this.Hn.Zc.Ad(decoder, utils, app, hexByte);
        }
        ;
        for (var gameSettings = 1; gameSettings < this.$c; gameSettings++) {
          var savedGame = this.Jm[gameSettings * 3];
          var savedData = this.Jm[gameSettings * 3 + 1];
          var key = this.Jm[gameSettings * 3 + 2];
          this.Hn._c[gameSettings].Ad(savedGame, savedData, app, config, key);
        }
      };
      config.prototype._m = function (app) {
        app.render(this.Hn.Yc);
      };
      return config;
    }();
    app.Uf = function () {
      function app(app) {
        this.Wd = app;
      }
      app.Tf = $("#background-canvas");
      app.Qn = $("#stretch-box");
      app.Rn = $("#social-buttons");
      app.Sn = $("#markup-wrap");
      app.Tn = $("#game-view");
      app.Un = $("#results-view");
      app.Vn = $("#main-menu-view");
      app.Wn = $("#popup-view");
      app.Xn = $("#toaster-view");
      app.Yn = $("#loading-view");
      app.Zn = $("#restricted-view");
      app.$n = $("#error-gateway-connection-view");
      app._n = $("#error-game-connection-view");
      app.prototype.Sa = function () {};
      app.prototype.ml = function () {};
      app.prototype.nl = function () {};
      app.prototype.hl = function () {};
      app.prototype.qg = function () {};
      app.prototype.ug = function (app, config) {};
      return app;
    }();
    finalCaption = $("#final-caption");
    app0 = $("#final-continue");
    app1 = $("#congrats-bg");
    app2 = $("#unl6wj4czdl84o9b");
    app3 = $("#final-share-fb");
    app4 = $("#final-message");
    app5 = $("#final-score");
    app6 = $("#final-place");
    app7 = $("#final-board");
    app8 = $("#game-canvas");
    (app9 = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.ao);
      var utils = this;
      var savedGame = app8.get()[0];
      app3.toggle(config.co.bo);
      finalCaption.text(decoder.U("index.game.result.title"));
      app0.text(decoder.U("index.game.result.continue"));
      app0.click(function () {
        ooo.ij.if();
        config.co.do.Va();
        ooo.ij.Ye(app.Pe.Se.Jf);
        ooo.Xg.gl(ooo.Xg.Jf);
      });
      $("html").keydown(function (app) {
        if (app.keyCode !== 17 || !(gameSettings.ctrl = true)) {
          if (app.keyCode !== 17) {
            gameSettings.ctrl = false;
          }
        }
        if (app.keyCode === 32) {
          utils.eo = true;
        }
      }).keyup(function (app) {
        gameSettings.ctrl = false;
        if (hexByte.on && gameSettings.s) {
          if (app.keyCode == 81 || app.keyCode == 87) {
            if (app.keyCode == 81) {
              _0x4d0ax2f.texture = _0x4d0ax28;
              _0x4d0ax30.texture = _0x4d0ax29;
              _0x4d0ax2f.alpha = 1;
              _0x4d0ax30.alpha = 0.25;
              detectMobileDevice3();
            }
            if (app.keyCode == 87) {
              _0x4d0ax30.texture = _0x4d0ax2a;
              _0x4d0ax2f.texture = _0x4d0ax27;
              _0x4d0ax2f.alpha = 0.25;
              _0x4d0ax30.alpha = 1;
              detectMobileDevice8();
            }
          } else {
            _0x4d0ax30.texture = _0x4d0ax29;
            _0x4d0ax2f.texture = _0x4d0ax27;
            _0x4d0ax30.alpha = 0.25;
            _0x4d0ax2f.alpha = 0.25;
            _0x4d0ax22 = false;
            _0x4d0ax23 = 55;
            _0x4d0ax24 = 1;
            _0x4d0ax25 = true;
            clearInterval(mapSprite);
            mapSprite = null;
          }
          if (app.keyCode == 90) {
            if (gameSettings.z == 1) {
              if (gameSettings.h) {
                gameSettings.z = 1.6;
              } else {
                gameSettings.z = 1.2;
              }
              _0x4d0ax31.texture = _0x4d0ax2c;
              _0x4d0ax31.alpha = 1;
            } else {
              gameSettings.z = 1;
              _0x4d0ax31.texture = _0x4d0ax2b;
              _0x4d0ax31.alpha = 0.25;
            }
          }
          if (gameSettings.hz && !gameSettings.mobile) {
            if (app.keyCode == 188 && gameSettings.z >= 0.2) {
              gameSettings.z = gameSettings.z - 0.1;
            }
            if (app.keyCode == 190 && gameSettings.z <= 25) {
              gameSettings.z = gameSettings.z + 0.1;
            }
          }
        }
        if (hexByte.on && app.keyCode == 82) {
          if (!window.lastRespawnTime) {
            window.lastRespawnTime = 0;
          }
          const currentTime = new Date().getTime();
          const timeSinceLastRespawn = currentTime - window.lastRespawnTime;
          if (timeSinceLastRespawn < 1000) {
            return;
          }
          window.lastRespawnTime = currentTime;
          try {
            if (ooo.Mh && ooo.Mh.Rq && typeof ooo.Mh.Rq.close === "function") {
              ooo.Mh.Rq.close();
            }
            if (ooo.Mh && typeof ooo.Mh.uj === "function") {
              ooo.Mh.uj();
            }
            setTimeout(function () {
              if (document.getElementById("mm-action-play")) {
                document.getElementById("mm-action-play").click();
              }
            }, 300);
          } catch (e) {
            document.getElementById("mm-action-play").click();
          }
          if (gameSettings.pi && gameSettings.pn) {
            $("#port_id_s").val(gameSettings.pi);
            $("#port_name_s").val(gameSettings.pn);
            $("#port_id").val($("#port_id_s").val());
            $("#port_name").val($("#port_name_s").val());
          }
          gameSettings.r1 = true;
        }
        if (hexByte.on && app.keyCode == 78) {
          document.getElementById("settings-show-names-switch").click();
          if (gameSettings.sn) {
            gameSettings.sn = false;
          } else {
            gameSettings.sn = true;
          }
        }
        
if (app.keyCode === 77) { // مفتاح M
  if (gameSettings) {
    gameSettings.showSkinLines = !gameSettings.showSkinLines;
    console.log("خطوط السكن:", gameSettings.showSkinLines ? "مفعلة" : "معطلة");
    localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
  }
}


        if (app.keyCode === 32) {
          utils.eo = false;
        }
      });
      savedGame.addEventListener("touchmove", function (app) {
        if (hexByte.on && gameSettings.mobile && gameSettings.mo != 6 && gameSettings.s) {
          var config = btoa(gameSettings.c_1);
          if (gameSettings.mo1.x != -1 && gameSettings.mo1.y == -1 && btoa(config) == gameSettings.d_1 || gameSettings.mo2.x == -1 && gameSettings.mo2.y != -1 && btoa(config) == gameSettings.d_1) {
            var decoder = ooo.Xg.Kf.Wg.Ah;
            var savedData = savedGame.offsetHeight;
            var key = savedGame.offsetWidth;
            var updateJoystickEnabled = savedData * 0.5;
            var updateJoystickColor = key * 0.5;
            var updateJoystickMode = btoa(gameSettings.c_2);
            for (let updateJoystickPosition = 0; updateJoystickPosition < app.changedTouches.length; updateJoystickPosition++) {
              var updateJoystickCoordinates = app.changedTouches[updateJoystickPosition].pageX;
              var updateJoystickSize = app.changedTouches[updateJoystickPosition].pageY;
              var processPlayerData = app.changedTouches[updateJoystickPosition].identifier;
              if (gameSettings.mo == 1 && btoa(updateJoystickMode) == gameSettings.d_2) {
                savedData *= 0.5;
                key *= 0.5;
              }
              if (gameSettings.mo == 2 && btoa(updateJoystickMode) == gameSettings.d_2) {
                savedData = decoder.img_o_2.y + 110;
                key = decoder.img_o_2.x + 110;
              }
              if (gameSettings.mo == 3 && btoa(updateJoystickMode) == gameSettings.d_2) {
                savedData = decoder.img_o_3.y + 110;
                key = decoder.img_o_3.x + 110;
              }
              if (gameSettings.mo == 4 && btoa(updateJoystickMode) == gameSettings.d_2 || gameSettings.mo == 5 && btoa(updateJoystickMode) == gameSettings.d_2) {
                savedData = decoder.img_o_4.y + 110;
                key = decoder.img_o_4.x + 110;
              }
              var createJoystick = btoa(gameSettings.c_5);
              var parsePlayerData = Math.atan2(updateJoystickSize - savedData, updateJoystickCoordinates - key);
              var validateParameter = Math.cos(parsePlayerData);
              var validatePlayerNameFormat = Math.sin(parsePlayerData);
              var extractRealName = btoa(gameSettings.c_4);
              var savedOco = gameSettings.mo1.x == processPlayerData;
              btoa(gameSettings.c_3);
              if (savedOco && btoa(extractRealName) == gameSettings.d_4) {
                if (updateJoystickCoordinates <= 0 || updateJoystickSize <= 0) {
                  gameSettings.mo1.x = -1;
                  if (gameSettings.mo == 1) {
                    decoder.img_p_1.alpha = 0.25;
                  }
                  if (gameSettings.mo == 2) {
                    decoder.img_o_2.alpha = 0.25;
                    decoder.img_i_2.alpha = 0.25;
                    decoder.img_p_2.alpha = 0.25;
                  }
                  if (gameSettings.mo == 3) {
                    decoder.img_o_3.alpha = 0.25;
                    decoder.img_i_3.alpha = 0.25;
                    decoder.img_p_3.alpha = 0.25;
                  }
                  if (gameSettings.mo == 4 || gameSettings.mo == 5) {
                    decoder.img_p_2.alpha = 0.25;
                  }
                } else {
                  utils.fo = parsePlayerData;
                  var savedSw = 50;
                  if (gameSettings.mo == 1 || gameSettings.mo == 4 || gameSettings.mo == 5) {
                    savedSw = 110;
                  }
                  var savedImages = key - updateJoystickCoordinates;
                  var savedImageVersion = savedData - updateJoystickSize;
                  var customWear = Math.sqrt(savedImages * savedImages + savedImageVersion * savedImageVersion);
                  var customSkin = updateJoystickColor + customWear * validateParameter - 68;
                  var mapSprite = updateJoystickEnabled + customWear * validatePlayerNameFormat - 68;
                  var _0x4d0ax21 = updateJoystickColor + savedSw * validateParameter - 68;
                  var _0x4d0ax22 = updateJoystickEnabled + savedSw * validatePlayerNameFormat - 68;
                  var _0x4d0ax23 = updateJoystickColor + validateParameter * 75 - 68;
                  var _0x4d0ax24 = updateJoystickEnabled + validatePlayerNameFormat * 75 - 68;
                  var _0x4d0ax25 = updateJoystickCoordinates - 85;
                  var _0x4d0ax26 = updateJoystickSize - 85;
                  var _0x4d0ax27 = key + savedSw * validateParameter - 85;
                  var _0x4d0ax28 = savedData + savedSw * validatePlayerNameFormat - 85;
                  var _0x4d0ax29 = key + validateParameter * 3 - 110;
                  var _0x4d0ax2a = savedData + validatePlayerNameFormat * 3 - 110;
                  if (customWear < savedSw) {
                    if (gameSettings.mo2.x == -1 && gameSettings.mo2.y != -1) {
                      decoder.img_pf_1.x = customSkin;
                      decoder.img_pf_1.y = mapSprite;
                    } else {
                      if (gameSettings.mo == 1) {
                        decoder.img_p_1.x = customSkin;
                        decoder.img_p_1.y = mapSprite;
                      }
                      if (gameSettings.mo == 2 || gameSettings.mo == 4 || gameSettings.mo == 5) {
                        decoder.img_p_2.x = customSkin;
                        decoder.img_p_2.y = mapSprite;
                      }
                      if (gameSettings.mo == 3) {
                        decoder.img_p_3.x = customSkin;
                        decoder.img_p_3.y = mapSprite;
                      }
                    }
                    if (gameSettings.mo == 2) {
                      decoder.img_i_2.y = _0x4d0ax26;
                      decoder.img_i_2.x = _0x4d0ax25;
                    }
                    if (gameSettings.mo == 3) {
                      decoder.img_i_3.y = _0x4d0ax26;
                      decoder.img_i_3.x = _0x4d0ax25;
                    }
                  } else {
                    if (gameSettings.mo2.x == -1 && gameSettings.mo2.y != -1) {
                      decoder.img_pf_1.x = _0x4d0ax21;
                      decoder.img_pf_1.y = _0x4d0ax22;
                      if (gameSettings.mo == 2 || gameSettings.mo == 3) {
                        if (customWear < 75) {
                          decoder.img_pf_1.x = customSkin;
                          decoder.img_pf_1.y = mapSprite;
                        } else {
                          decoder.img_pf_1.x = _0x4d0ax23;
                          decoder.img_pf_1.y = _0x4d0ax24;
                        }
                      }
                    } else {
                      if (gameSettings.mo == 1) {
                        decoder.img_p_1.x = _0x4d0ax21;
                        decoder.img_p_1.y = _0x4d0ax22;
                      }
                      if (gameSettings.mo == 2 || gameSettings.mo == 4 || gameSettings.mo == 5) {
                        decoder.img_p_2.x = _0x4d0ax21;
                        decoder.img_p_2.y = _0x4d0ax22;
                        if (gameSettings.mo == 2) {
                          if (customWear < 75) {
                            decoder.img_p_2.x = customSkin;
                            decoder.img_p_2.y = mapSprite;
                          } else {
                            decoder.img_p_2.x = _0x4d0ax23;
                            decoder.img_p_2.y = _0x4d0ax24;
                          }
                        }
                      }
                      if (gameSettings.mo == 3) {
                        if (customWear < 75) {
                          decoder.img_p_3.x = customSkin;
                          decoder.img_p_3.y = mapSprite;
                        } else {
                          decoder.img_p_3.x = _0x4d0ax23;
                          decoder.img_p_3.y = _0x4d0ax24;
                        }
                      }
                    }
                    if (gameSettings.mo == 2) {
                      decoder.img_i_2.y = _0x4d0ax28;
                      decoder.img_i_2.x = _0x4d0ax27;
                    }
                    if (gameSettings.mo == 3) {
                      decoder.img_i_3.y = _0x4d0ax28;
                      decoder.img_i_3.x = _0x4d0ax27;
                      decoder.img_o_3.y = _0x4d0ax2a;
                      decoder.img_o_3.x = _0x4d0ax29;
                    }
                  }
                }
              } else if ((savedOco = gameSettings.mo2.y == processPlayerData) && btoa(createJoystick) == gameSettings.d_5) {
                if (updateJoystickCoordinates <= 0 || updateJoystickSize <= 0) {
                  gameSettings.mo2.y = -1;
                  decoder.img_f.visible = false;
                  decoder.img_pf_1.visible = false;
                  if (gameSettings.mo == 1) {
                    decoder.img_p_1.visible = true;
                  }
                  if (gameSettings.mo == 2 || gameSettings.mo == 4 || gameSettings.mo == 5) {
                    decoder.img_p_2.visible = true;
                  }
                  if (gameSettings.mo == 3) {
                    decoder.img_p_3.visible = true;
                  }
                  if (gameSettings.mo == 4 || gameSettings.mo == 5) {
                    decoder.img_f.visible = true;
                  }
                  utils.eo = false;
                } else if (gameSettings.mo == 3) {
                  validateParameter = Math.cos(parsePlayerData = Math.atan2(updateJoystickSize - (savedData = decoder.img_f.y + 100), updateJoystickCoordinates - (key = decoder.img_f.x + 100)));
                  validatePlayerNameFormat = Math.sin(parsePlayerData);
                  var _0x4d0ax25 = key + validateParameter * 3 - 100;
                  var _0x4d0ax26 = savedData + validatePlayerNameFormat * 3 - 100;
                  var savedImages = key - updateJoystickCoordinates;
                  var savedImageVersion = savedData - updateJoystickSize;
                  var customWear = Math.sqrt(savedImages * savedImages + savedImageVersion * savedImageVersion);
                  if (customWear >= 40) {
                    decoder.img_f.y = _0x4d0ax25;
                    decoder.img_f.x = _0x4d0ax26;
                  }
                }
              }
            }
          }
        } else if (!detectMobileDevice() || !gameSettings.joystick.checked) {
          if (app = app || window.event) {
            if ((app = app.touches[0]).clientX !== undefined) {
              utils.fo = Math.atan2(app.clientY - savedGame.offsetHeight * 0.5, app.clientX - savedGame.offsetWidth * 0.5);
            } else {
              utils.fo = Math.atan2(app.pageY - savedGame.offsetHeight * 0.5, app.pageX - savedGame.offsetWidth * 0.5);
            }
          }
        }
      }, true);
      savedGame.addEventListener("touchstart", function (app) {
        if (hexByte.on && gameSettings.mobile && gameSettings.mo != 6 && gameSettings.s) {
          var config = ooo.Xg.Kf.Wg.Ah;
          var decoder = btoa(gameSettings.c_4);
          var savedData = savedGame.offsetHeight;
          var key = btoa(gameSettings.c_3);
          var detectMobileDevice = savedGame.offsetWidth;
          var updateJoystickEnabled = btoa(gameSettings.c_5);
          var updateJoystickColor = (app = app || window.event).touches.item(0).pageX;
          var updateJoystickMode = btoa(gameSettings.c_2);
          var updateJoystickPosition = app.touches.item(0).pageY;
          var updateJoystickCoordinates = app.touches.length;
          var updateJoystickSize = btoa(gameSettings.c_1);
          var processPlayerData = app.touches.item(0).identifier;
          for (let createJoystick = 0; createJoystick < updateJoystickCoordinates; createJoystick++) {
            if (gameSettings.mo2.x == -1 && gameSettings.mo2.y != -1) {
              if (app.touches.item(createJoystick).identifier != gameSettings.mo2.y) {
                updateJoystickColor = app.touches.item(createJoystick).pageX;
                updateJoystickPosition = app.touches.item(createJoystick).pageY;
                processPlayerData = app.touches.item(createJoystick).identifier;
              }
            } else {
              updateJoystickColor = app.touches.item(createJoystick).pageX;
              updateJoystickPosition = app.touches.item(createJoystick).pageY;
              processPlayerData = app.touches.item(createJoystick).identifier;
            }
          }
          ;
          var parsePlayerData = 0;
          if (gameSettings.mo == 4 && btoa(updateJoystickEnabled) == gameSettings.d_5 || gameSettings.mo == 5 && btoa(decoder) == gameSettings.d_4) {
            parsePlayerData = Math.sqrt((updateJoystickColor - config.img_f.x - 100) * (updateJoystickColor - config.img_f.x - 100) + (updateJoystickPosition - config.img_f.y - 100) * (updateJoystickPosition - config.img_f.y - 100));
          }
          if (updateJoystickCoordinates == 1 && (gameSettings.mo == 4 && parsePlayerData > 40 || gameSettings.mo != 4) && (gameSettings.mo == 5 && parsePlayerData > 40 || gameSettings.mo != 5)) {
            gameSettings.mo2.y = -1;
            config.img_f.visible = false;
            config.img_pf_1.visible = false;
            if (gameSettings.mo == 1) {
              config.img_p_1.alpha = 0.25;
              config.img_p_1.visible = true;
            }
            if (gameSettings.mo == 2) {
              config.img_o_2.alpha = 0.25;
              config.img_i_2.alpha = 0.25;
              config.img_p_2.alpha = 0.25;
              config.img_p_2.visible = true;
            }
            if (gameSettings.mo == 3) {
              config.img_o_3.alpha = 0.25;
              config.img_i_3.alpha = 0.25;
              config.img_p_3.alpha = 0.25;
              config.img_p_3.visible = true;
            }
            if (gameSettings.mo == 4 || gameSettings.mo == 5) {
              config.img_p_2.alpha = 0.25;
              config.img_p_2.visible = true;
              config.img_f.visible = true;
            }
            utils.eo = false;
          }
          if (gameSettings.mo1.x == -1 && gameSettings.mo1.y == -1 && btoa(decoder) == gameSettings.d_4 && (gameSettings.mo == 4 && parsePlayerData > 40 || gameSettings.mo != 4 && btoa(key) == gameSettings.d_3) && (gameSettings.mo == 5 && parsePlayerData > 40 || gameSettings.mo != 5 && btoa(updateJoystickMode) == gameSettings.d_2)) {
            gameSettings.mo1.x = processPlayerData;
            if (gameSettings.mo1.x == gameSettings.mo2.y && gameSettings.mo1.y == gameSettings.mo2.x) {
              updateJoystickColor = app.touches.item(1).pageX;
              updateJoystickPosition = app.touches.item(1).pageY;
            }
            var validateParameter = detectMobileDevice * 0.5 - 68;
            var validatePlayerNameFormat = savedData * 0.5 - 68;
            var extractRealName = updateJoystickColor - 110;
            var savedOco = updateJoystickPosition - 110;
            var savedSw = updateJoystickColor - 85;
            var savedImages = updateJoystickPosition - 85;
            if (gameSettings.mo == 1 && gameSettings.mo2.x == -1 && gameSettings.mo2.y == -1) {
              config.img_p_1.alpha = 1;
              config.img_p_1.x = validateParameter;
              config.img_p_1.y = validatePlayerNameFormat;
              config.img_p_1.visible = true;
            }
            if (gameSettings.mo == 2) {
              config.img_o_2.alpha = 1;
              config.img_o_2.x = extractRealName;
              config.img_o_2.y = savedOco;
              config.img_i_2.alpha = 1;
              config.img_i_2.x = savedSw;
              config.img_i_2.y = savedImages;
              if (gameSettings.mo2.x == -1 && gameSettings.mo2.y == -1) {
                config.img_p_2.alpha = 1;
                config.img_p_2.x = validateParameter;
                config.img_p_2.y = validatePlayerNameFormat;
                config.img_p_2.visible = true;
              }
            }
            if (gameSettings.mo == 3 && btoa(updateJoystickEnabled) == gameSettings.d_5) {
              config.img_o_3.alpha = 1;
              config.img_o_3.x = extractRealName;
              config.img_o_3.y = savedOco;
              config.img_i_3.alpha = 1;
              config.img_i_3.x = savedSw;
              config.img_i_3.y = savedImages;
              if (gameSettings.mo2.x == -1 && gameSettings.mo2.y == -1) {
                config.img_p_3.alpha = 1;
                config.img_p_3.x = validateParameter;
                config.img_p_3.y = validatePlayerNameFormat;
                config.img_p_3.visible = true;
              }
            }
            if (gameSettings.mo == 4 && btoa(updateJoystickMode) == gameSettings.d_2 && gameSettings.mo2.x == -1 && gameSettings.mo2.y == -1) {
              config.img_p_2.alpha = 1;
              config.img_p_2.x = validateParameter;
              config.img_p_2.y = validatePlayerNameFormat;
              config.img_p_2.visible = true;
            }
            if (gameSettings.mo == 5 && btoa(key) == gameSettings.d_3 && gameSettings.mo2.x == -1 && gameSettings.mo2.y == -1) {
              config.img_p_2.alpha = 1;
              config.img_p_2.x = validateParameter;
              config.img_p_2.y = validatePlayerNameFormat;
              config.img_p_2.visible = true;
            }
          } else if (updateJoystickCoordinates >= 2 && gameSettings.mo2.x == -1 && gameSettings.mo2.y == -1 && btoa(key) == gameSettings.d_3 || updateJoystickCoordinates == 1 && gameSettings.mo == 4 && parsePlayerData <= 40 && btoa(updateJoystickSize) == gameSettings.d_1 || updateJoystickCoordinates == 1 && gameSettings.mo == 5 && parsePlayerData <= 40 && btoa(updateJoystickMode) == gameSettings.d_2) {
            gameSettings.mo2.y = processPlayerData;
            config.img_f.visible = true;
            config.img_pf_1.visible = true;
            if (gameSettings.mo == 1) {
              config.img_p_1.visible = false;
              config.img_pf_1.x = config.img_p_1.x;
              config.img_pf_1.y = config.img_p_1.y;
            }
            if (gameSettings.mo == 2 || gameSettings.mo == 4 || gameSettings.mo == 5) {
              config.img_p_2.visible = false;
              config.img_pf_1.x = config.img_p_2.x;
              config.img_pf_1.y = config.img_p_2.y;
            }
            if (gameSettings.mo == 3 && btoa(key) == gameSettings.d_3) {
              config.img_p_3.visible = false;
              config.img_pf_1.x = config.img_p_3.x;
              config.img_pf_1.y = config.img_p_3.y;
            }
            if (gameSettings.mo != 4 && gameSettings.mo != 5) {
              config.img_f.x = updateJoystickColor - 100;
              config.img_f.y = updateJoystickPosition - 100;
            }
            utils.eo = true;
          }
          ;
          app.preventDefault();
        } else {
          if (app = app || window.event) {
            utils.eo = app.touches.length >= 2;
          }
          app.preventDefault();
        }
      }, true);
      savedGame.addEventListener("touchend", function (app) {
        if (hexByte.on && gameSettings.mobile && gameSettings.mo != 6 && gameSettings.s) {
          var config = ooo.Xg.Kf.Wg.Ah;
          var decoder = btoa(gameSettings.c_1);
          if (app = app || window.event) {
            if ((app = app.changedTouches[0]).clientX !== undefined) {
              detectMobileDevicee(app.clientX, app.clientY);
            } else {
              detectMobileDevicee(app.pageX, app.pageY);
            }
          }
          var savedGame = btoa(gameSettings.c_2);
          var savedData = app.identifier;
          if (savedData == gameSettings.mo1.x && gameSettings.mo1.y == -1 && btoa(savedGame) == gameSettings.d_2) {
            gameSettings.mo1.x = -1;
            if (gameSettings.mo == 1) {
              config.img_p_1.alpha = 0.25;
            }
            if (gameSettings.mo == 2) {
              config.img_o_2.alpha = 0.25;
              config.img_i_2.alpha = 0.25;
              config.img_p_2.alpha = 0.25;
            }
            if (gameSettings.mo == 3 && btoa(decoder) == gameSettings.d_1) {
              config.img_o_3.alpha = 0.25;
              config.img_i_3.alpha = 0.25;
              config.img_p_3.alpha = 0.25;
            }
            if (gameSettings.mo == 4) {
              config.img_p_2.alpha = 0.25;
            }
            if (gameSettings.mo == 5) {
              config.img_p_2.alpha = 0.25;
            }
          }
          var key = btoa(gameSettings.c_3);
          if (gameSettings.mo2.x == -1 && savedData == gameSettings.mo2.y && btoa(key) == gameSettings.d_3) {
            gameSettings.mo2.y = -1;
            config.img_f.visible = false;
            config.img_pf_1.visible = false;
            if (gameSettings.mo == 1) {
              config.img_p_1.visible = true;
            }
            if (gameSettings.mo == 2 || gameSettings.mo == 4 && btoa(savedGame) == gameSettings.d_2 || gameSettings.mo == 5 && btoa(key) == gameSettings.d_3) {
              config.img_p_2.visible = true;
            }
            if (gameSettings.mo == 3) {
              config.img_p_3.visible = true;
            }
            if (gameSettings.mo == 4 || gameSettings.mo == 5) {
              config.img_f.visible = true;
            }
            utils.eo = false;
          }
        } else {
          if (app = app || window.event) {
            utils.eo = app.touches.length >= 2;
          }
          if (gameSettings.mobile && gameSettings.s && (app = app || window.event)) {
            if ((app = app.changedTouches[0]).clientX !== undefined) {
              detectMobileDevicee(app.clientX, app.clientY);
            } else {
              detectMobileDevicee(app.pageX, app.pageY);
            }
          }
        }
      }, true);
      savedGame.addEventListener("mousemove", function (config) {
        if (config = config || app.c.event && _typeof(config.clientX) != "undefined") {
          utils.fo = decoder.ta(config.clientY - savedGame.offsetHeight * 0.5, config.clientX - savedGame.offsetWidth * 0.5);
        }
      }, true);
      savedGame.addEventListener("mousedown", function (app) {
        utils.eo = true;
      }, true);
      savedGame.addEventListener("mouseup", function (app) {
        utils.eo = false;
      }, true);
      this.Wg = new app.lh(app8);
      this.go = appa.ho;
      this.fo = 0;
      this.eo = false;
      hexByte.eie = utils;
    })).prototype.Sa = function () {};
    app9.prototype.ml = function () {
      app.Nf.rg(false);
      utils.f.h(app.Uf.Tf, 50);
      utils.f.h(app.Uf.Qn, 1);
      utils.f.h(app.Uf.Rn, 50);
      utils.f.h(app.Uf.Sn, 50);
      utils.f.g(app.Uf.Tn, 500);
      if (this.go === appa.ho) {
        utils.f.h(app.Uf.Un, 1);
      } else {
        utils.f.g(app.Uf.Un, 500);
      }
      utils.f.h(app.Uf.Vn, 50);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.h(app.Uf.Xn, 50);
      utils.f.h(app.Uf.Yn, 50);
      utils.f.h(app.Uf.Zn, 50);
      utils.f.h(app.Uf.$n, 50);
      utils.f.h(app.Uf._n, 50);
    };
    app9.prototype.ho = function () {
      this.go = appa.ho;
      return this;
    };
    app9.prototype.io = function () {
      utils.f.h(app1, 1);
      decoder.Y(function () {
        utils.f.g(app1, 500);
      }, 3000);
      utils.f.h(app2, 1);
      decoder.Y(function () {
        utils.f.g(app2, 500);
      }, 500);
      this.go = appa.io;
      return this;
    };
    app9.prototype.nl = function () {
      this.eo = false;
      this.Wg.qg();
      if (this.go === appa.io) {
        ooo.ij.mf();
      }
    };
    app9.prototype.qg = function () {
      this.Wg.qg();
    };
    app9.prototype.ug = function (app, config) {
      this.Wg.ug(app, config);
    };
    app9.prototype.jo = function (app, utils, hexByte) {
      var gameSettings;
      var savedGame;
      var savedData;
      if (utils >= 1 && utils <= 10) {
        gameSettings = decoder.U("index.game.result.place.i" + utils);
        savedGame = decoder.U("index.game.result.placeInBoard");
        savedData = decoder.U("index.game.social.shareResult.messGood").replace("{0}", hexByte).replace("{1}", app).replace("{2}", gameSettings);
      } else {
        gameSettings = "";
        savedGame = decoder.U("index.game.result.tryHit");
        savedData = decoder.U("index.game.social.shareResult.messNorm").replace("{0}", hexByte).replace("{1}", app);
      }
      app4.html(decoder.U("index.game.result.your"));
      app5.html(app);
      app6.html(gameSettings);
      app7.html(savedGame);
      if (config.co.bo) {
        var key;
        var detectMobileDevice;
        var updateJoystickEnabled;
        var updateJoystickColor;
        var updateJoystickMode;
        var updateJoystickPosition;
        var updateJoystickCoordinates;
        var updateJoystickSize = decoder.U("index.game.result.share");
        decoder.U("index.game.social.shareResult.caption");
        app3.empty().append((key = updateJoystickSize, detectMobileDevice = "https://wormate.io", updateJoystickEnabled = "wormate.io", updateJoystickColor = savedData, updateJoystickMode = savedData, updateJoystickPosition = "https://wormate.io/images/og-share-img-new.jpg", (updateJoystickCoordinates = $("<div><svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" x=\"0\" y=\"0\" viewBox=\"0 0 456 456\" xml: space=\"preserve\"><rect x=\"0\" y=\"0\" width=\"456\" height=\"456\" fill=\"#517AD1\"/><path d=\"M242.7 456V279.7h-59.3v-71.9h59.3v-60.4c0-43.9 35.6-79.5 79.5-79.5h62v64.6h-44.4c-13.9 0-25.3 11.3-25.3 25.3v50h68.5l-9.5 71.9h-59.1V456z\" fill=\"#fff\"/></svg><span>" + key + "</span></div>")).click(function () {
          if ((typeof FB == "undefined" ? "undefined" : _typeof(FB)) !== "undefined" && _typeof(FB.ui) != "undefined") {
            FB.ui({
              method: "feed",
              display: "popup",
              link: detectMobileDevice,
              name: updateJoystickEnabled,
              caption: updateJoystickColor,
              description: updateJoystickMode,
              picture: updateJoystickPosition
            }, function () {});
          }
        }), updateJoystickCoordinates));
      }
    };
    app9.prototype.ko = function () {
      return this.fo;
    };
    app9.prototype.lo = function () {
      return this.eo;
    };
    appa = {
      ho: 0,
      io: 1
    };
    app.Bk = app9;
    appb = $("#loading-progress-cont");
    appc = $("#loading-progress-bar");
    appd = $("#loading-progress-text");
    (appe = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.ao);
      this.mo = -1;
      this.no = "";
    })).prototype.Sa = function () {};
    appe.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.g(app.Uf.Tf, 500);
      utils.f.g(app.Uf.Qn, 1);
      utils.f.h(app.Uf.Rn, 50);
      utils.f.h(app.Uf.Sn, 50);
      utils.f.h(app.Uf.Tn, 50);
      utils.f.h(app.Uf.Un, 50);
      utils.f.h(app.Uf.Vn, 50);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.h(app.Uf.Xn, 50);
      utils.f.g(app.Uf.Yn, 500);
      utils.f.h(app.Uf.Zn, 50);
      utils.f.h(app.Uf.$n, 50);
      utils.f.h(app.Uf._n, 50);
    };
    appe.prototype.nl = function () {
      ooo.ij.Ye(app.Pe.Se.Re);
      ooo.Xg.Ak.wg();
      ooo.Xg.Ak.sg(true);
    };
    appe.prototype.hl = function () {
      ooo.Xg.Ak.sg(false);
    };
    appe.prototype.oo = function () {
      this.po("", 0);
      utils.f.g(appb, 100);
    };
    appe.prototype.qo = function () {
      utils.f.h(appb, 100);
    };
    appe.prototype.po = function (app, config) {
      if (this.no !== app) {
        this.no = app;
      }
      var utils = decoder.fa(decoder._(config * 100), 0, 100);
      if (this.mo !== utils) {
        appc.css("width", utils + "%");
        appd.html(utils + " %");
      }
    };
    app.$k = appe;
    appf = $("#mm-line-top");
    $("#mm-line-center");
    $("#mm-line-bottom");
    config0 = $("#mm-bottom-buttons");
    config1 = $("#mm-menu-cont");
    config2 = $("#mm-loading");
    config3 = $("#mm-loading-progress-bar");
    config4 = $("#mm-loading-progress-text");
    $("#mm-event-text");
    config5 = $("#mm-skin-canv");
    config6 = $("#mm-skin-prev");
    config7 = $("#mm-skin-next");
    config8 = $("#mm-skin-over");
    config9 = $("#mm-skin-over-button-list");
    configa = $("#mm-params-nickname");
    configb = $("#mm-params-game-mode");
    configc = $("#mm-action-play");
    configd = $("#mm-action-guest");
    confige = $("#mm-action-login");
    configf = $("#mm-player-info");
    decoder0 = $("#mm-store");
    decoder1 = $("#mm-leaders");
    decoder2 = $("#mm-settings");
    decoder3 = $("#mm-coins-box");
    decoder4 = $("#mm-player-avatar");
    decoder5 = $("#mm-player-username");
    decoder6 = $("#mm-coins-val");
    decoder7 = $("#mm-player-exp-bar");
    decoder8 = $("#mm-player-exp-val");
    decoder9 = $("#mm-player-level");
    (decodera = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.kl);
      this.mo = -1;
      this.no = "";
      this.ro = new app.Lm(config5);
      configb.click(function () {
        ooo.ij.if();
      });
      config5.click(function () {
        if (ooo.ok.nk()) {
          ooo.ij.if();
          ooo.Xg.gl(ooo.Xg.Qk);
        }
      });
      config6.click(function () {
        ooo.ij.if();
        ooo.so.kk();
      });
      config7.click(function () {
        ooo.ij.if();
        ooo.so.jk();
      });
      configa.keypress(function (app) {
        gameSettings.r1 = false;
        if (app.keyCode === 13) {
          ooo.to();
        }
      });
      configc.click(function () {
        ooo.ij.if();
        ooo.to();
      });
      configd.click(function () {
        ooo.ij.if();
        ooo.to();
      });
      confige.click(function () {
        ooo.ij.if();
        ooo.Xg.gl(ooo.Xg.Nk);
      });
      decoder2.click(function () {
        ooo.ij.if();
        ooo.Xg.gl(ooo.Xg.Hi);
      });
      configf.click(function () {
        if (ooo.ok.nk()) {
          ooo.ij.if();
          ooo.Xg.gl(ooo.Xg.Lk);
        }
      });
      decoder1.click(function () {
        if (ooo.ok.nk()) {
          ooo.ij.if();
          ooo.Xg.gl(ooo.Xg.Jk);
        }
      });
      decoder0.click(function () {
        if (ooo.ok.nk()) {
          ooo.ij.if();
          ooo.Xg.gl(ooo.Xg.Sk);
        }
      });
      decoder3.click(function () {
        if (ooo.ok.nk()) {
          ooo.ij.if();
          ooo.Xg.gl(ooo.Xg.Hk);
        }
      });
      this.uo();
      this.vo();
      var config = app.Cg.Og(app.Cg.Ig);
      if (config !== "ARENA" && config !== "TEAM2") {
        config = "ARENA";
      }
      configb.val(config);
    })).prototype.Sa = function () {
      var utils = this;
      function hexByte(app, config) {
        if (app.pm) {
          config.skinId = app.pm.Tj;
          config.eyesId = app.pm.Uj;
          config.mouthId = app.pm.Vj;
          config.hatId = app.pm.Wj;
          config.glassesId = app.pm.Xj;
        }
      }
      ooo.ok.fm(function () {
        if (ooo.ok.nk()) {
          hexByte(gameSettings, ooo.ok.xl);
          ooo.so.lk(ooo.ok.Ul(), app._j.$j);
          ooo.so.lk(ooo.ok.Vl(), app._j.ak);
          ooo.so.lk(ooo.ok.Wl(), app._j.bk);
          ooo.so.lk(ooo.ok.Xl(), app._j.dk);
          ooo.so.lk(ooo.ok.Yl(), app._j.ck);
        } else {
          ooo.so.lk(ooo.wo(), app._j.$j);
          ooo.so.lk(0, app._j.ak);
          ooo.so.lk(0, app._j.bk);
          ooo.so.lk(0, app._j.dk);
          ooo.so.lk(0, app._j.ck);
        }
      });
      ooo.ok.fm(function () {
        configc.toggle(ooo.ok.nk());
        confige.toggle(!ooo.ok.nk());
        configd.toggle(!ooo.ok.nk());
        decoder1.toggle(ooo.ok.nk());
        decoder0.toggle(ooo.ok.nk());
        decoder3.toggle(ooo.ok.nk());
        configf.toggle(true);
        decoder2.toggle(true);
        if (ooo.ok.nk()) {
          config8.hide();
          decoder5.html(ooo.ok.Ll());
          decoder4.attr("src", ooo.ok.Nl());
          decoder6.html(ooo.ok.Ql());
          decoder7.width(ooo.ok.Sl() * 100 / ooo.ok.Tl() + "%");
          decoder8.html(ooo.ok.Sl() + " / " + ooo.ok.Tl());
          decoder9.html(ooo.ok.Rl());
          configa.val(ooo.ok.Ml());
        } else {
          config8.toggle(config.co.bo && !ooo.xo());
          decoder5.html(decoder5.data("guest"));
          decoder4.attr("src", config.H.M);
          decoder6.html("10");
          decoder7.width("0");
          decoder8.html("");
          decoder9.html(1);
          configa.val(app.Cg.Og(app.Cg.Jg));
        }
      });
      ooo.so.fk(function () {
        utils.ro.Gm(ooo.so.ek());
      });
    };
    decodera.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.g(app.Uf.Tf, 500);
      utils.f.g(app.Uf.Qn, 1);
      utils.f.g(app.Uf.Rn, 500);
      utils.f.g(app.Uf.Sn, 500);
      utils.f.h(app.Uf.Tn, 50);
      utils.f.h(app.Uf.Un, 50);
      utils.f.g(app.Uf.Vn, 500);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.h(app.Uf.Xn, 50);
      utils.f.h(app.Uf.Yn, 50);
      utils.f.h(app.Uf.Zn, 50);
      utils.f.h(app.Uf.$n, 50);
      utils.f.h(app.Uf._n, 50);
    };
    decodera.prototype.yo = function () {
      utils.f.g(appf, 500);
      utils.f.g(config0, 500);
      utils.f.g(config1, 500);
      utils.f.h(config2, 100);
    };
    decodera.prototype.zo = function () {
      utils.f.h(appf, 100);
      utils.f.h(config0, 100);
      utils.f.h(config1, 100);
      utils.f.g(config2, 500);
    };
    decodera.prototype.po = function (app, config) {
      if (this.no !== app) {
        this.no = app;
      }
      var utils = decoder.fa(decoder._(config * 100), 0, 100);
      if (this.mo !== utils) {
        config3.css("width", utils + "%");
        config4.html(utils + " %");
      }
    };
    decodera.prototype.nl = function () {
      ooo.ij.jf();
      this.ro.rg(true);
    };
    decodera.prototype.hl = function () {
      this.ro.rg(false);
    };
    decodera.prototype.qg = function () {
      this.ro.qg();
    };
    decodera.prototype.ug = function (app, config) {
      this.ro.ug();
    };
    decodera.prototype.Ml = function () {
      return configa.val();
    };
    decodera.prototype.Ao = function () {
      return configb.val();
    };
    decodera.prototype.uo = function () {
      var app = $("#mm-advice-cont").children();
      var config = 0;
      decoder.X(function () {
        app.eq(config).fadeOut(500, function () {
          if (++config >= app.length) {
            config = 0;
          }
          app.eq(config).fadeIn(500).css("display", "inline-block");
        });
      }, 3000);
    };
    decodera.prototype.vo = function () {
      if (config.co.bo && !ooo.xo()) {
        config8.show();
        var app = decoder.U("index.game.main.menu.unlockSkins.share");
        var utils = encodeURIComponent(decoder.U("index.game.main.menu.unlockSkins.comeAndPlay"));
        config9.append($("<a class=\"mm-skin-over-button\" id=\"mm-skin-over-fb\" target=\"_blank\" href=\"https://www.facebook.com/dialog/share?app_id=861926850619051&display=popup&href=https%3A%2F%2Fwormate.io&redirect_uri=https%3A%2F%2Fwormate.io&hashtag=%23wormateio&quote=" + utils + "\"><img src=\"data: image/svg+xml; base64, PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeD0iMCIgeT0iMCIgdmlld0JveD0iMCAwIDQ1NiA0NTYiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxwYXRoIGQ9Ik0yNDQuMyA0NTZWMjc5LjdoLTU5LjN2LTcxLjloNTkuM3YtNjAuNGMwLTQzLjkgMzUuNi03OS41IDc5LjUtNzkuNWg2MnY2NC42aC00NC40Yy0xMy45IDAtMjUuMyAxMS4zLTI1LjMgMjUuM3Y1MGg2OC41bC05LjUgNzEuOWgtNTkuMVY0NTZ6IiBmaWxsPSIjZmZmIi8+PC9zdmc+\"/><span>" + app + "</span></a>").click(function app() {
          ooo.Bo(true);
          decoder.Y(function () {
            config8.hide();
          }, 3000);
        }));
      }
    };
    app.Ck = decodera;
    (decoderb = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.ao);
    })).prototype.Sa = function () {};
    decoderb.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.h(app.Uf.Tf, 50);
      utils.f.h(app.Uf.Qn, 1);
      utils.f.h(app.Uf.Rn, 50);
      utils.f.h(app.Uf.Sn, 50);
      utils.f.h(app.Uf.Tn, 50);
      utils.f.h(app.Uf.Un, 50);
      utils.f.h(app.Uf.Vn, 50);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.h(app.Uf.Xn, 50);
      utils.f.h(app.Uf.Yn, 50);
      utils.f.h(app.Uf.Zn, 50);
      utils.f.h(app.Uf.$n, 50);
      utils.f.h(app.Uf._n, 50);
    };
    app.el = decoderb;
    (decoderc = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.ao);
    })).prototype.Sa = function () {};
    decoderc.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.g(app.Uf.Tf, 500);
      utils.f.g(app.Uf.Qn, 1);
      utils.f.h(app.Uf.Rn, 50);
      utils.f.h(app.Uf.Sn, 50);
      utils.f.h(app.Uf.Tn, 50);
      utils.f.h(app.Uf.Un, 50);
      utils.f.h(app.Uf.Vn, 50);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.h(app.Uf.Xn, 50);
      utils.f.h(app.Uf.Yn, 50);
      utils.f.g(app.Uf.Zn, 500);
      utils.f.h(app.Uf.$n, 50);
      utils.f.h(app.Uf._n, 50);
    };
    decoderc.prototype.nl = function () {};
    app.Xk = decoderc;
    decoderd = $("#toaster-stack");
    (decodere = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.ao);
      this.Co = [];
      this.Do = null;
    })).prototype.Sa = function () {};
    decodere.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.g(app.Uf.Tf, 500);
      utils.f.g(app.Uf.Qn, 1);
      utils.f.h(app.Uf.Rn, 50);
      utils.f.g(app.Uf.Sn, 500);
      utils.f.h(app.Uf.Tn, 50);
      utils.f.h(app.Uf.Un, 50);
      utils.f.h(app.Uf.Vn, 50);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.g(app.Uf.Xn, 500);
      utils.f.h(app.Uf.Yn, 50);
      utils.f.h(app.Uf.Zn, 50);
      utils.f.h(app.Uf.$n, 50);
      utils.f.h(app.Uf._n, 50);
    };
    decodere.prototype.nl = function () {
      this.Eo();
    };
    decodere.prototype.ql = function () {
      return this.Do != null || this.Co.length > 0;
    };
    decodere.prototype.Fo = function (app) {
      this.Co.unshift(app);
      decoder.Y(function () {
        ooo.Xg.ol();
      }, 0);
    };
    decodere.prototype.km = function (app) {
      this.Co.push(app);
      decoder.Y(function () {
        ooo.Xg.ol();
      }, 0);
    };
    decodere.prototype.Eo = function () {
      var app = this;
      if (this.Do == null) {
        if (this.Co.length === 0) {
          ooo.Xg.jl();
          return;
        }
        ;
        var config = this.Co.shift();
        this.Do = config;
        var hexByte = config.ag();
        utils.f.g(hexByte, 300);
        decoderd.append(hexByte);
        config.Go = function () {
          hexByte.fadeOut(300);
          decoder.Y(function () {
            hexByte.remove();
          }, 300);
          if (app.Do === config) {
            app.Do = null;
          }
          app.Eo();
        };
        config.nl();
      }
    };
    app.Zk = decodere;
    app.ll = {
      ao: 0,
      kl: 1
    };
    decoderf = $("#popup-menu-label");
    utils0 = $("#popup-menu-coins-box");
    utils1 = $("#popup-menu-coins-val");
    $("#popup-menu-back").click(function () {
      ooo.ij.if();
      ooo.Xg.jl();
    });
    utils0.click(function () {
      if (ooo.ok.nk()) {
        ooo.ij.if();
        ooo.Xg.gl(ooo.Xg.Hk);
      }
    });
    (utils2 = decoder.ca(app.Uf, function (config, decoder) {
      app.Uf.call(this, app.ll.kl);
      this.Xa = config;
      this.Io = decoder;
      this.Jo = [];
    })).prototype.Sa = function () {
      utils2.parent.prototype.Sa.call(this);
      if (!utils2.Ko) {
        utils2.Ko = true;
        ooo.ok.fm(function () {
          if (ooo.ok.nk()) {
            utils1.html(ooo.ok.Ql());
          } else {
            utils1.html("0");
          }
        });
      }
      utils.f.h(app.Ho.Lo, 100);
    };
    utils2.Mo = $("#coins-view");
    utils2.No = $("#leaders-view");
    utils2.Oo = $("#profile-view");
    utils2.Po = $("#login-view");
    utils2.Qo = $("#settings-view");
    utils2.Ro = $("#skins-view");
    utils2.So = $("#store-view");
    utils2.To = $("#wear-view");
    utils2.Uo = $("#withdraw-consent-view");
    utils2.Vo = $("#delete-account-view");
    utils2.Lo = $("#please-wait-view");
    utils2.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.g(app.Uf.Tf, 1);
      utils.f.g(app.Uf.Qn, 500);
      utils.f.g(app.Uf.Rn, 200);
      utils.f.g(app.Uf.Sn, 200);
      utils.f.h(app.Uf.Tn, 200);
      utils.f.h(app.Uf.Un, 200);
      utils.f.h(app.Uf.Vn, 200);
      utils.f.g(app.Uf.Wn, 200);
      utils.f.h(app.Uf.Xn, 200);
      utils.f.h(app.Uf.Yn, 200);
      utils.f.h(app.Uf.Zn, 200);
      utils.f.h(app.Uf.$n, 200);
      utils.f.h(app.Uf._n, 200);
      decoderf.html(this.Xa);
      utils0.toggle(this.Io);
      this.Wo();
    };
    utils2.prototype.Wo = function () {};
    utils2.prototype.Xo = function (config) {
      var hexByte = this;
      var gameSettings = decoder.va(0, 2147483647) & 2147483647;
      this.Jo.push(gameSettings);
      utils.f.g(app.Ho.Lo, 100);
      decoder.Y(function () {
        hexByte.Yo(gameSettings);
      }, config);
      return new keyf(this, gameSettings);
    };
    utils2.prototype.Yo = function (config) {
      var decoder = this.Jo.indexOf(config);
      if (!(decoder < 0)) {
        this.Jo.splice(decoder, 1);
        if (this.Jo.length === 0) {
          utils.f.h(app.Ho.Lo, 100);
        }
      }
    };
    app.Ho = utils2;
    var pixiLib;
    var pixiBlendModes;
    var pixiWrapModes;
    var _0x4d0ax3b;
    var i18nMessages;
    var charCodes;
    var _0x4d0ax3e;
    var finalCaption;
    var app0;
    var app1;
    var app2;
    var app3;
    var app4;
    var app5;
    var app6;
    var app7;
    var app8;
    var app9;
    var appa;
    var appb;
    var appc;
    var appd;
    var appe;
    var appf;
    var config0;
    var config1;
    var config2;
    var config3;
    var config4;
    var config5;
    var config6;
    var config7;
    var config8;
    var config9;
    var configa;
    var configb;
    var configc;
    var configd;
    var confige;
    var configf;
    var decoder0;
    var decoder1;
    var decoder2;
    var decoder3;
    var decoder4;
    var decoder5;
    var decoder6;
    var decoder7;
    var decoder8;
    var decoder9;
    var decodera;
    var decoderb;
    var decoderc;
    var decoderd;
    var decodere;
    var decoderf;
    var utils0;
    var utils1;
    var utils2;
    var utils3;
    var utils4;
    var utils5;
    var utils6;
    var utils7;
    var utils8;
    var utils9;
    var utilsa;
    var utilsb;
    var utilsc;
    var utilsd;
    var utilse;
    var utilsf;
    var hexByte0;
    var hexByte1;
    var hexByte2;
    var hexByte3;
    var hexByte4;
    var hexByte5;
    var hexByte6;
    var hexByte7;
    var hexByte8;
    var hexByte9;
    var hexBytea;
    var hexByteb;
    var hexBytec;
    var hexByted;
    var hexBytee;
    var hexBytef;
    var gameSettings0;
    var gameSettings1;
    var gameSettings2;
    var gameSettings3;
    var gameSettings4;
    var gameSettings5;
    var gameSettings6;
    var gameSettings7;
    var gameSettings8;
    var gameSettings9;
    var gameSettingsa;
    var gameSettingsb;
    var gameSettingsc;
    var gameSettingsd;
    var gameSettingse;
    var gameSettingsf;
    var savedGame0;
    var savedGame1;
    var savedGame2;
    var savedGame3;
    var savedGame4;
    var savedGame5;
    var savedGame6;
    var savedGame7;
    var savedGame8;
    var savedGame9;
    var savedGamea;
    var savedGameb;
    var savedGamec;
    var savedGamed;
    var savedGamee;
    var savedGamef;
    var savedData0;
    var savedData1;
    var savedData2;
    var savedData3;
    var savedData4;
    var savedData5;
    var savedData6;
    var savedData7;
    var savedData8;
    var savedData9;
    var savedDataa;
    var savedDatab;
    var savedDatac;
    var savedDatad;
    var savedDatae;
    var savedDataf;
    var key0;
    var key1;
    var key2;
    var key3;
    var key4;
    var key5;
    var key6;
    var key7;
    var key8;
    var key9;
    var keya;
    var keyb;
    var keyc;
    var keyd;
    var keye;
    var keyf = function () {
      function app(app, config) {
        this.Zo = app;
        this.$o = config;
      }
      app.prototype._o = function () {
        this.Zo.Yo(this.$o);
      };
      return app;
    }();
    utils3 = $("#store-buy-coins_125000");
    utils4 = $("#store-buy-coins_50000");
    utils5 = $("#store-buy-coins_16000");
    utils6 = $("#store-buy-coins_7000");
    utils7 = $("#store-buy-coins_3250");
    utils8 = $("#store-buy-coins_1250");
    (utils9 = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.coins.tab"), false);
      var config = this;
      utils3.click(function () {
        ooo.ij.if();
        config.ap("coins_125000");
      });
      utils4.click(function () {
        ooo.ij.if();
        config.ap("coins_50000");
      });
      utils5.click(function () {
        ooo.ij.if();
        config.ap("coins_16000");
      });
      utils6.click(function () {
        ooo.ij.if();
        config.ap("coins_7000");
      });
      utils7.click(function () {
        ooo.ij.if();
        config.ap("coins_3250");
      });
      utils8.click(function () {
        ooo.ij.if();
        config.ap("coins_1250");
      });
    })).prototype.Sa = function () {
      utils9.parent.prototype.Sa.call(this);
    };
    utils9.prototype.Wo = function () {
      utils.f.g(app.Ho.Mo, 200);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    utils9.prototype.nl = function () {
      ooo.ij.jf();
    };
    utils9.prototype.ap = function (app) {};
    app.Ik = utils9;
    utilsa = $("#highscore-table");
    utilsb = $("#leaders-button-level");
    utilsc = $("#leaders-button-highscore");
    utilsd = $("#leaders-button-kills");
    utilse = "byLevel";
    utilsf = "byHighScore";
    hexByte0 = "byKillsAndHeadShots";
    (hexByte1 = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.leaders.tab"), true);
      var config = this;
      this.bp = {};
      this.cp = {
        dp: {
          ep: utilsb,
          fp: utilse
        },
        gp: {
          ep: utilsc,
          fp: utilsf
        },
        hp: {
          ep: utilsd,
          fp: hexByte0
        }
      };
      utilsb.click(function () {
        ooo.ij.if();
        config.ip(config.cp.dp);
      });
      utilsc.click(function () {
        ooo.ij.if();
        config.ip(config.cp.gp);
      });
      utilsd.click(function () {
        ooo.ij.if();
        config.ip(config.cp.hp);
      });
    })).prototype.Sa = function () {
      hexByte1.parent.prototype.Sa.call(this);
    };
    hexByte1.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.g(app.Ho.No, 200);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    hexByte1.prototype.nl = function () {
      var app = this;
      ooo.ij.jf();
      var utils = this.Xo(5000);
      var hexByte = config.H.J + "/pub/leaders";
      decoder.Aa(hexByte, function () {
        var config = {
          [utilse]: [],
          [utilsf]: [],
          [hexByte0]: []
        };
        app.bp = config;
        app.ip(app.jp ?? app.cp.dp);
        utils._o();
      }, function (config) {
        app.bp = config;
        app.ip(app.jp ?? app.cp.dp);
        utils._o();
      });
    };
    hexByte1.prototype.ip = function (app) {
      this.jp = app;
      for (var config in this.cp) {
        if (this.cp.hasOwnProperty(config)) {
          this.cp[config].ep.removeClass("pressed");
        }
      }
      ;
      this.jp.ep.addClass("pressed");
      for (var utils = this.bp[this.jp.fp], hexByte = "", gameSettings = 0; gameSettings < utils.length; gameSettings++) {
        var savedGame = utils[gameSettings];
        hexByte += `<div class="table-row"><span>${gameSettings + 1}</span><span><img src="${savedGame.avatarUrl}"/></span><span>${savedGame.username}</span><span>${savedGame.level}</span><span>${savedGame.highScore}</span><span>${savedGame.headShots} / ${savedGame.kills}</span></div>`;
      }
      ;
      utilsa.empty();
      utilsa.append(hexByte);
    };
    app.Kk = hexByte1;
    hexByte2 = $("#popup-login-gg");
    hexByte3 = $("#popup-login-fb");
    (hexByte4 = decoder.ca(app.Ho, function () {
      var config = this;
      app.Ho.call(this, decoder.U("index.game.popup.menu.login.tab"), false);
      hexByte2.click(function () {
        ooo.ij.if();
        var app = config.Xo(10000);
        decoder.Y(function () {
          ooo.ok.sm(function () {
            if (ooo.ok.nk()) {
              ooo.ij.mf();
            }
            app._o();
          });
        }, 500);
      });
      hexByte3.click(function () {
        ooo.ij.if();
        var app = config.Xo(10000);
        decoder.Y(function () {
          ooo.ok.pm(function () {
            if (ooo.ok.nk()) {
              ooo.ij.mf();
            }
            app._o();
          });
        }, 500);
      });
    })).prototype.Sa = function () {
      hexByte4.parent.prototype.Sa.call(this);
    };
    hexByte4.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.g(app.Ho.Po, 200);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    hexByte4.prototype.nl = function () {
      ooo.ij.jf();
    };
    app.Ok = hexByte4;
    hexByte5 = $("#profile-avatar");
    hexByte6 = $("#profile-username");
    hexByte7 = $("#profile-experience-bar");
    hexByte8 = $("#profile-experience-val");
    hexByte9 = $("#profile-level");
    hexBytea = $("#profile-stat-highScore");
    hexByteb = $("#profile-stat-bestSurvivalTime");
    hexBytec = $("#profile-stat-kills");
    hexByted = $("#profile-stat-headshots");
    hexBytee = $("#profile-stat-gamesPlayed");
    hexBytef = $("#profile-stat-totalTimeSpent");
    gameSettings0 = $("#profile-stat-registrationDate");
    (gameSettings1 = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.profile.tab"), true);
    })).prototype.Sa = function () {
      gameSettings1.parent.prototype.Sa.call(this);
    };
    gameSettings1.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.g(app.Ho.Oo, 200);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    gameSettings1.prototype.nl = function () {
      ooo.ij.jf();
      var app = ooo.ok.dm();
      var config = moment([app.year, app.month - 1, app.day]).format("LL");
      hexByte6.html(ooo.ok.Ll());
      hexByte5.attr("src", ooo.ok.Nl());
      hexByte7.width(ooo.ok.Sl() * 100 / ooo.ok.Tl() + "%");
      hexByte8.html(ooo.ok.Sl() + " / " + ooo.ok.Tl());
      hexByte9.html(ooo.ok.Rl());
      hexBytea.html(ooo.ok.Zl());
      hexByteb.html(decoder.$(ooo.ok.$l()));
      hexBytec.html(ooo.ok._l());
      hexByted.html(ooo.ok.am());
      hexBytee.html(ooo.ok.bm());
      hexBytef.html(decoder.$(ooo.ok.cm()));
      gameSettings0.html(config);
    };
    app.Mk = gameSettings1;
    gameSettings2 = $("#settings-music-enabled-switch");
    gameSettings3 = $("#settings-sfx-enabled-switch");
    gameSettings4 = $("#settings-show-names-switch");
    gameSettings5 = $("#popup-logout");
    gameSettings6 = $("#popup-logout-container");
    gameSettings7 = $("#popup-delete-account");
    gameSettings8 = $("#popup-delete-account-container");
    gameSettings9 = $("#popup-withdraw-consent");
    (gameSettingsa = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.settings.tab"), false);
      var config = this;
      gameSettings2.click(function () {
        var config = !!gameSettings2.prop("checked");
        app.Cg.Ng(app.Cg.Fg, config, 30);
        ooo.ij.$e(config);
        ooo.ij.if();
      });
      gameSettings3.click(function () {
        var config = !!gameSettings3.prop("checked");
        app.Cg.Ng(app.Cg.Gg, config, 30);
        ooo.ij.Xe(config);
        ooo.ij.if();
      });
      gameSettings4.click(function () {
        ooo.ij.if();
      });
      gameSettings5.click(function () {
        ooo.ij.if();
        config.Xo(500);
        ooo.ok.qm();
      });
      gameSettings7.click(function () {
        if (ooo.ok.nk()) {
          ooo.ij.if();
          ooo.Xg.gl(ooo.Xg.Fk);
        } else {
          ooo.ij.nf();
        }
      });
      gameSettings9.click(function () {
        if (ooo.kp()) {
          ooo.ij.if();
          ooo.Xg.gl(ooo.Xg.Dk);
        } else {
          ooo.ij.nf();
        }
      });
    })).prototype.Sa = function () {
      var config;
      var utils;
      var hexByte;
      gameSettingsa.parent.prototype.Sa.call(this);
      config = app.Cg.Og(app.Cg.Fg) !== "false";
      gameSettings2.prop("checked", config);
      ooo.ij.$e(config);
      utils = app.Cg.Og(app.Cg.Gg) !== "false";
      gameSettings3.prop("checked", utils);
      ooo.ij.Xe(utils);
      hexByte = app.Cg.Og(app.Cg.Eg) !== "false";
      gameSettings4.prop("checked", hexByte);
      ooo.ok.em(function () {
        gameSettings6.toggle(ooo.ok.nk());
        gameSettings8.toggle(ooo.ok.nk());
      });
    };
    gameSettingsa.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.g(app.Ho.Qo, 200);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    gameSettingsa.prototype.nl = function () {
      ooo.ij.jf();
      if (ooo.kp()) {
        gameSettings9.show();
      } else {
        gameSettings9.hide();
      }
    };
    gameSettingsa.prototype.Gi = function () {
      return gameSettings4.prop("checked");
    };
    app.Pk = gameSettingsa;
    gameSettingsb = $("#store-view-canv");
    gameSettingsc = $("#skin-description-text");
    gameSettingsd = $("#skin-group-description-text");
    gameSettingse = $("#store-locked-bar");
    gameSettingsf = $("#store-locked-bar-text");
    savedGame0 = $("#store-buy-button");
    savedGame1 = $("#store-item-price");
    savedGame2 = $("#store-groups");
    savedGame3 = $("#store-view-prev");
    savedGame4 = $("#store-view-next");
    (savedGame5 = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.skins.tab"), true);
      var config = this;
      this.lp = null;
      this.mp = [];
      this.np = {};
      this.op = new app.Lm(gameSettingsb);
      savedGame0.click(function () {
        ooo.ij.if();
        config.pp();
      });
      savedGame3.click(function () {
        ooo.ij.if();
        config.lp.qp();
      });
      savedGame4.click(function () {
        ooo.ij.if();
        config.lp.rp();
      });
    })).prototype.Sa = function () {
      savedGame5.parent.prototype.Sa.call(this);
      var app = this;
      ooo.ud.Jc(function () {
        var config = ooo.ud.Gc();
        app.mp = [];
        for (var utils = 0; utils < config.skinGroupArrayDict.length; utils++) {
          app.mp.push(new savedGame6(app, config.skinGroupArrayDict[utils]));
        }
        ;
        app.np = {};
        for (var hexByte = 0; hexByte < config.skinArrayDict.length; hexByte++) {
          var gameSettings = config.skinArrayDict[hexByte];
          app.np[gameSettings.id] = gameSettings;
        }
        ;
        app.sp();
      });
      this.tp(false);
      ooo.so.fk(function () {
        app.tp(false);
      });
    };
    savedGame5.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.g(app.Ho.Ro, 200);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    savedGame5.prototype.nl = function () {
      ooo.ij.Ye(app.Pe.Se.Jf);
      ooo.ij.jf();
      this.sp();
      this.op.rg(true);
    };
    savedGame5.prototype.hl = function () {
      this.op.rg(false);
    };
    savedGame5.prototype.qg = function () {
      this.op.qg();
    };
    savedGame5.prototype.ug = function (app, config) {
      this.op.ug();
    };
    savedGame5.prototype.sp = function () {
      var config = this;
      var utils = this;
      savedGame2.empty();
      for (var hexByte = 0; hexByte < this.mp.length; hexByte++) {
        (function (hexByte) {
          var gameSettings = config.mp[hexByte];
          var savedGame = app.d.createElement("li");
          savedGame2.append(savedGame);
          var savedData = $(savedGame);
          if (utils.xp && utils.xp.isCustom) {
            savedData.addClass("iscustom");
          }
          savedData.html(gameSettings.up());
          savedData.click(function () {
            ooo.ij.if();
            utils.vp(gameSettings);
          });
          gameSettings.wp = savedData;
        })(hexByte);
      }
      ;
      if (this.mp.length > 0) {
        var gameSettings = ooo.so.Zj(app._j.$j);
        for (var savedGame = 0; savedGame < this.mp.length; savedGame++) {
          var savedData = this.mp[savedGame];
          for (var key = savedData.xp.list, detectMobileDevice = 0; detectMobileDevice < key.length; detectMobileDevice++) {
            if (key[detectMobileDevice] === gameSettings) {
              savedData.yp = detectMobileDevice;
              this.vp(savedData);
              return;
            }
          }
        }
        ;
        this.vp(this.mp[0]);
      }
    };
    savedGame5.prototype.vp = function (app) {
      if (this.lp !== app) {
        this.lp = app;
        savedGame2.children().removeClass("pressed");
        if (this.lp.wp) {
          this.lp.wp.addClass("pressed");
        }
        gameSettingsd.html("");
        if (app.xp != null) {
          var config = ooo.ud.Gc().textDict[app.xp.description];
          if (config != null) {
            gameSettingsd.html(decoder.aa(decoder.V(config)));
          }
        }
        ;
        this.tp(true);
      }
    };
    savedGame5.prototype.zp = function () {
      if (this.lp == null) {
        return app.yj.Aj();
      } else {
        return this.lp.Ap();
      }
    };
    savedGame5.prototype.pp = function () {
      var app = this.zp();
      if (app.Cj()) {
        var config = app.Mc();
        this.Bp(config);
      }
    };
    savedGame5.prototype.Bp = function (config) {
      var decoder = ooo.so.mk(config, app._j.$j);
      if (decoder != null) {
        var utils = decoder.pk();
        if (!(ooo.ok.Ql() < utils)) {
          var hexByte = ooo.so.Zj(app._j.$j);
          var gameSettings = ooo.so.Zj(app._j.ak);
          var savedGame = ooo.so.Zj(app._j.bk);
          var savedData = ooo.so.Zj(app._j.dk);
          var key = ooo.so.Zj(app._j.ck);
          var detectMobileDevice = this.Xo(5000);
          ooo.ok.nm(config, app._j.$j, function () {
            detectMobileDevice._o();
            ooo.Xg.gl(ooo.Xg._k);
          }, function () {
            ooo.ok.hm(function () {
              ooo.so.lk(hexByte, app._j.$j);
              ooo.so.lk(gameSettings, app._j.ak);
              ooo.so.lk(savedGame, app._j.bk);
              ooo.so.lk(savedData, app._j.dk);
              ooo.so.lk(key, app._j.ck);
              ooo.so.lk(config, app._j.$j);
              detectMobileDevice._o();
            });
          });
        }
      }
    };
    savedGame5.prototype.tp = function (config) {
      var utils = ooo.so.ek();
      var hexByte = this.zp();
      if (hexByte.Cj()) {
        var gameSettings = hexByte.Mc();
        var savedGame = ooo.so.mk(gameSettings, app._j.$j);
        var savedData = false;
        if (ooo.so.ik(gameSettings, app._j.$j)) {
          gameSettingse.hide();
          savedGame0.hide();
        } else if (savedGame == null || savedGame.qk()) {
          savedData = true;
          gameSettingse.show();
          savedGame0.hide();
          gameSettingsf.text(decoder.U("index.game.popup.menu.store.locked"));
          if (savedGame != null && savedGame.qk()) {
            var key = ooo.ud.Gc().textDict[savedGame.ln()];
            if (key != null) {
              gameSettingsf.text(decoder.V(key));
            }
          }
        } else {
          gameSettingse.hide();
          savedGame0.show();
          savedGame1.html(savedGame.pk());
        }
        ;
        gameSettingsc.html("");
        if (savedGame != null && savedGame.mn() != null) {
          var detectMobileDevice = ooo.ud.Gc().textDict[savedGame.mn()];
          if (detectMobileDevice != null) {
            gameSettingsc.html(decoder.aa(decoder.V(detectMobileDevice)));
          }
        }
        ;
        this.op.Gm(utils.Cn(gameSettings));
        this.op.an(savedData);
        if (config) {
          ooo.so.lk(gameSettings, app._j.$j);
        }
      }
    };
    savedGame6 = function () {
      function config(app, config) {
        this.Cp = app;
        this.yp = 0;
        this.xp = config;
      }
      config.prototype.qp = function () {
        if (--this.yp < 0) {
          this.yp = this.xp.list.length - 1;
        }
        this.Cp.tp(true);
      };
      config.prototype.rp = function () {
        if (++this.yp >= this.xp.list.length) {
          this.yp = 0;
        }
        this.Cp.tp(true);
      };
      config.prototype.up = function () {
        let app = decoder.V(this.xp.name);
        if (this.xp.img) {
          if ((this.xp.img.search("data:image/png;base64,") == -1 || !(app = "<img src=\"" + this.xp.img + "\" height=\"40\" />")) && (this.xp.img.search("https://lh3.googleusercontent.com") == -1 || !(app = "<img src=\"" + this.xp.img + "\" height=\"40\" />"))) {
            app = "<img src=\"" + gameSettings.s_l + "/images/" + this.xp.img + "\" height=\"40\" />";
          }
        }
        return app;
      };
      config.prototype.Ap = function () {
        if (this.yp >= this.xp.list.length) {
          return app.yj.Aj();
        } else {
          return app.yj.Bj(this.xp.list[this.yp]);
        }
      };
      return config;
    }();
    app.Rk = savedGame5;
    savedGame7 = $("#store-go-coins-button");
    savedGame8 = $("#store-go-skins-button");
    savedGame9 = $("#store-go-wear-button");
    (savedGamea = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.store.tab"), true);
      savedGame7.click(function () {
        ooo.ij.if();
        ooo.Xg.gl(ooo.Xg.Hk);
      });
      savedGame8.click(function () {
        ooo.ij.if();
        ooo.Xg.gl(ooo.Xg.Qk);
      });
      savedGame9.click(function () {
        ooo.ij.if();
        ooo.Xg.gl(ooo.Xg.Uk);
      });
    })).prototype.Sa = function () {
      savedGamea.parent.prototype.Sa.call(this);
    };
    savedGamea.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.g(app.Ho.So, 200);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    savedGamea.prototype.nl = function () {
      ooo.ij.jf();
    };
    app.Tk = savedGamea;
    savedGameb = $("#wear-view-canv");
    savedGamec = $("#wear-description-text");
    savedGamed = $("#wear-locked-bar");
    savedGamee = $("#wear-locked-bar-text");
    savedGamef = $("#wear-buy-button");
    savedData0 = $("#wear-item-price");
    savedData1 = $("#wear-eyes-button");
    savedData2 = $("#wear-mouths-button");
    savedData3 = $("#wear-glasses-button");
    savedData4 = $("#wear-hats-button");
    savedData5 = $("#wear-tint-chooser");
    savedData6 = $("#wear-view-prev");
    savedData7 = $("#wear-view-next");
    (savedData8 = decoder.ca(app.Ho, function () {
      var config = this;
      app.Ho.call(this, decoder.U("index.game.popup.menu.wear.tab"), true);
      var utils = this;
      this.Dp = [];
      this.ak = new savedData9(this, app._j.ak, savedData1);
      this.bk = new savedData9(this, app._j.bk, savedData2);
      this.dk = new savedData9(this, app._j.dk, savedData3);
      this.ck = new savedData9(this, app._j.ck, savedData4);
      this.Ep = null;
      this.Fp = null;
      this.Gp = null;
      this.Hp = null;
      this.Ip = null;
      this.Jp = null;
      this.op = new app.Lm(savedGameb);
      savedGamef.click(function () {
        ooo.ij.if();
        utils.Kp();
      });
      savedData6.click(function () {
        ooo.ij.if();
        utils.Ep.Lp();
      });
      savedData7.click(function () {
        ooo.ij.if();
        utils.Ep.Mp();
      });
      savedData1.click(function () {
        ooo.ij.if();
        utils.Np(config.ak);
      });
      savedData2.click(function () {
        ooo.ij.if();
        utils.Np(config.bk);
      });
      savedData3.click(function () {
        ooo.ij.if();
        utils.Np(config.dk);
      });
      savedData4.click(function () {
        ooo.ij.if();
        utils.Np(config.ck);
      });
      this.Dp.push(this.ak);
      this.Dp.push(this.bk);
      this.Dp.push(this.dk);
      this.Dp.push(this.ck);
    })).prototype.Sa = function () {
      savedData8.parent.prototype.Sa.call(this);
      var app = this;
      ooo.ud.Jc(function () {
        var config = ooo.ud.Gc();
        app.Fp = config.eyesDict;
        app.Gp = config.mouthDict;
        app.Hp = config.glassesDict;
        app.Ip = config.hatDict;
        app.Jp = config.colorDict;
        app.ak.Op(config.eyesVariantArray);
        app.ak.Pp(app.Fp);
        app.bk.Op(config.mouthVariantArray);
        app.bk.Pp(app.Gp);
        app.dk.Op(config.glassesVariantArray);
        app.dk.Pp(app.Hp);
        app.ck.Op(config.hatVariantArray);
        app.ck.Pp(app.Ip);
      });
      this.tp(false);
      ooo.so.fk(function () {
        app.tp(false);
      });
    };
    savedData8.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.g(app.Ho.To, 200);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.h(app.Ho.Vo, 50);
    };
    savedData8.prototype.nl = function () {
      ooo.ij.Ye(app.Pe.Se.Jf);
      ooo.ij.jf();
      this.Np(this.Ep ?? this.ak);
      this.op.rg(true);
    };
    savedData8.prototype.hl = function () {
      this.op.rg(false);
    };
    savedData8.prototype.qg = function () {
      this.op.qg();
    };
    savedData8.prototype.ug = function (app, config) {
      this.op.ug();
    };
    savedData8.prototype.Np = function (app) {
      this.Ep = app;
      for (var config = 0; config < this.Dp.length; config++) {
        this.Dp[config].ep.removeClass("pressed");
      }
      ;
      this.Ep.ep.addClass("pressed");
      this.Ep.ml();
    };
    savedData8.prototype.Qp = function () {
      if (this.Ep == null) {
        return app.yj.Aj();
      } else {
        return app.yj.Bj({
          Je: this.Ep.Ap(),
          Wd: this.Ep.Wd
        });
      }
    };
    savedData8.prototype.Kp = function () {
      var app = this.Qp();
      if (app.Cj()) {
        var config = app.Mc();
        this.Rp(config.Je, config.Wd);
      }
    };
    savedData8.prototype.Rp = function (config, decoder) {
      var utils = ooo.so.mk(config, decoder);
      if (utils != null) {
        var hexByte = utils.pk();
        if (!(ooo.ok.Ql() < hexByte)) {
          var gameSettings = ooo.so.Zj(app._j.$j);
          var savedGame = ooo.so.Zj(app._j.ak);
          var savedData = ooo.so.Zj(app._j.bk);
          var key = ooo.so.Zj(app._j.dk);
          var detectMobileDevice = ooo.so.Zj(app._j.ck);
          var updateJoystickEnabled = this.Xo(5000);
          ooo.ok.nm(config, decoder, function () {
            updateJoystickEnabled._o();
            ooo.Xg.gl(ooo.Xg._k);
          }, function () {
            ooo.ok.hm(function () {
              ooo.so.lk(gameSettings, app._j.$j);
              ooo.so.lk(savedGame, app._j.ak);
              ooo.so.lk(savedData, app._j.bk);
              ooo.so.lk(key, app._j.dk);
              ooo.so.lk(detectMobileDevice, app._j.ck);
              ooo.so.lk(config, decoder);
              updateJoystickEnabled._o();
            });
          });
        }
      }
    };
    savedData8.prototype.tp = function (config) {
      var utils = ooo.so.ek();
      var hexByte = this.Qp();
      if (hexByte.Cj()) {
        var gameSettings = hexByte.Mc();
        var savedGame = ooo.so.mk(gameSettings.Je, gameSettings.Wd);
        var savedData = false;
        if (ooo.so.ik(gameSettings.Je, gameSettings.Wd)) {
          savedGamed.hide();
          savedGamef.hide();
        } else if (savedGame == null || savedGame.qk()) {
          savedData = true;
          savedGamed.show();
          savedGamef.hide();
          savedGamee.text(decoder.U("index.game.popup.menu.store.locked"));
          if (savedGame != null && savedGame.qk()) {
            var key = ooo.ud.Gc().textDict[savedGame.ln()];
            if (key != null) {
              savedGamee.text(decoder.V(key));
            }
          }
        } else {
          savedGamed.hide();
          savedGamef.show();
          savedData0.html(savedGame.pk());
        }
        ;
        savedGamec.html("");
        if (savedGame != null && savedGame.mn() != null) {
          var detectMobileDevice = ooo.ud.Gc().textDict[savedGame.mn()];
          if (detectMobileDevice != null) {
            savedGamec.html(decoder.aa(decoder.V(detectMobileDevice)));
          }
        }
        ;
        var updateJoystickEnabled = this.op;
        switch (gameSettings.Wd) {
          case app._j.ak:
            updateJoystickEnabled.Gm(utils.Dn(gameSettings.Je));
            updateJoystickEnabled.bn(savedData);
            break;
          case app._j.bk:
            updateJoystickEnabled.Gm(utils.En(gameSettings.Je));
            updateJoystickEnabled.cn(savedData);
            break;
          case app._j.dk:
            updateJoystickEnabled.Gm(utils.Gn(gameSettings.Je));
            updateJoystickEnabled.en(savedData);
            break;
          case app._j.ck:
            updateJoystickEnabled.Gm(utils.Fn(gameSettings.Je));
            updateJoystickEnabled.dn(savedData);
        }
        ;
        if (config) {
          ooo.so.lk(gameSettings.Je, gameSettings.Wd);
        }
      }
    };
    savedData9 = function () {
      function app(app, config, decoder) {
        this.Cp = app;
        this.Wd = config;
        this.ep = decoder;
        this.Lc = {};
        this.Sp = [[]];
        this.Tp = -10;
        this.Up = -10;
      }
      app.prototype.Op = function (app) {
        this.Sp = app;
      };
      app.prototype.Pp = function (app) {
        this.Lc = app;
      };
      app.prototype.ml = function () {
        var app = ooo.so.Zj(this.Wd);
        for (var config = 0; config < this.Sp.length; config++) {
          for (var decoder = 0; decoder < this.Sp[config].length; decoder++) {
            if (this.Sp[config][decoder] === app) {
              this.Vp(config);
              this.Wp(decoder);
              return;
            }
          }
        }
        ;
        this.Vp(0);
        this.Wp(0);
      };
      app.prototype.Lp = function () {
        var app = this.Tp - 1;
        if (app < 0) {
          app = this.Sp.length - 1;
        }
        this.Vp(app);
        this.Wp(this.Up % this.Sp[app].length);
      };
      app.prototype.Mp = function () {
        var app = this.Tp + 1;
        if (app >= this.Sp.length) {
          app = 0;
        }
        this.Vp(app);
        this.Wp(this.Up % this.Sp[app].length);
      };
      app.prototype.Vp = function (app) {
        var config = this;
        if (!(app < 0) && !(app >= this.Sp.length)) {
          this.Tp = app;
          savedData5.empty();
          var utils = this.Sp[this.Tp];
          if (utils.length > 1) {
            for (var hexByte = 0; hexByte < utils.length; hexByte++) {
              (function (app) {
                var hexByte = utils[app];
                var gameSettings = config.Lc[hexByte];
                var savedGame = "#" + config.Cp.Jp[gameSettings.prime];
                var savedData = $("<div style=\"border-color: " + savedGame + "\"></div>");
                savedData.click(function () {
                  ooo.ij.if();
                  config.Wp(app);
                });
                savedData5.append(savedData);
              })(hexByte);
            }
          }
        }
      };
      app.prototype.Wp = function (app) {
        if (!(app < 0) && !(app >= this.Sp[this.Tp].length)) {
          this.Up = app;
          savedData5.children().css("background-color", "transparent");
          var config = savedData5.children(":nth-child(" + (1 + app) + ")");
          config.css("background-color", config.css("border-color"));
          this.Cp.tp(true);
        }
      };
      app.prototype.Ap = function () {
        return this.Sp[this.Tp][this.Up];
      };
      return app;
    }();
    app.Vk = savedData8;
    savedDataa = $(".play-button");
    savedDatab = $(".close-button");
    (savedDatac = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.consent.tab"), false);
      savedDataa.click(function () {
        ooo.ij.if();
        if (ooo.kp()) {
          ooo.Xg.gl(ooo.Xg.Jf);
          ooo.Xp(false, true);
          ooo.Xg.Yk.Fo(new app.Yp());
        } else {
          ooo.Xg.jl();
        }
      });
      savedDatab.click(function () {
        ooo.ij.if();
        ooo.Xg.jl();
      });
    })).prototype.Sa = function () {
      savedDatac.parent.prototype.Sa.call(this);
    };
    savedDatac.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.g(app.Ho.Uo, 200);
      utils.f.h(app.Ho.Vo, 50);
    };
    savedDatac.prototype.nl = function () {
      ooo.ij.jf();
    };
    app.Ek = savedDatac;
    savedDatad = $("#delete-account-timer");
    savedDatae = $("#delete-account-yes");
    savedDataf = $("#delete-account-no");
    (key0 = decoder.ca(app.Ho, function () {
      app.Ho.call(this, decoder.U("index.game.popup.menu.delete.tab"), false);
      savedDatae.click(function () {
        ooo.ij.if();
        if (ooo.ok.nk()) {
          ooo.ok.ym();
          ooo.ok.qm();
        } else {
          ooo.Xg.jl();
        }
      });
      savedDataf.click(function () {
        ooo.ij.if();
        ooo.Xg.jl();
      });
      this.Zp = [];
    })).prototype.Sa = function () {
      key0.parent.prototype.Sa.call(this);
    };
    key0.prototype.Wo = function () {
      utils.f.h(app.Ho.Mo, 50);
      utils.f.h(app.Ho.No, 50);
      utils.f.h(app.Ho.Oo, 50);
      utils.f.h(app.Ho.Po, 50);
      utils.f.h(app.Ho.Qo, 50);
      utils.f.h(app.Ho.Ro, 50);
      utils.f.h(app.Ho.So, 50);
      utils.f.h(app.Ho.To, 50);
      utils.f.h(app.Ho.Uo, 50);
      utils.f.g(app.Ho.Vo, 200);
    };
    key0.prototype.nl = function () {
      ooo.ij.nf();
      utils.f.h(savedDatae, 1);
      utils.f.g(savedDatad, 1);
      savedDatad.text("..10 ..");
      this.$p();
      this._p(function () {
        savedDatad.text("..9 ..");
      }, 1000);
      this._p(function () {
        savedDatad.text("..8 ..");
      }, 2000);
      this._p(function () {
        savedDatad.text("..7 ..");
      }, 3000);
      this._p(function () {
        savedDatad.text("..6 ..");
      }, 4000);
      this._p(function () {
        savedDatad.text("..5 ..");
      }, 5000);
      this._p(function () {
        savedDatad.text("..4 ..");
      }, 6000);
      this._p(function () {
        savedDatad.text("..3 ..");
      }, 7000);
      this._p(function () {
        savedDatad.text("..2 ..");
      }, 8000);
      this._p(function () {
        savedDatad.text("..1 ..");
      }, 9000);
      this._p(function () {
        utils.f.g(savedDatae, 300);
        utils.f.h(savedDatad, 1);
      }, 10000);
    };
    key0.prototype._p = function (app, config) {
      var utils = decoder.Y(app, config);
      this.Zp.push(utils);
    };
    key0.prototype.$p = function () {
      for (var app = 0; app < this.Zp.length; app++) {
        decoder.Z(this.Zp[app]);
      }
      ;
      this.Zp = [];
    };
    app.Gk = key0;
    app.aq = function () {
      function app() {
        this.Go = function () {};
      }
      app.prototype.ag = function () {};
      app.prototype.nl = function () {};
      return app;
    }();
    (key1 = decoder.ca(app.aq, function (config) {
      app.aq.call(this);
      var utils = decoder.Ca() + "_" + decoder._(1000 + decoder.ma() * 8999);
      this.bq = $("<div id=\"" + utils + "\" class=\"toaster toaster-coins\"><img class=\"toaster-coins-img\" alt=\"Wormate Coin\" src=\"/images/coin_320.png\" /><div class=\"toaster-coins-val\">" + config + "</div><div class=\"toaster-coins-close\">" + decoder.U("index.game.toaster.continue") + "</div></div>");
      var hexByte = this;
      this.bq.find(".toaster-coins-close").click(function () {
        ooo.ij.if();
        hexByte.Go();
      });
    })).prototype.ag = function () {
      return this.bq;
    };
    key1.prototype.nl = function () {
      ooo.ij.lf();
    };
    app.mm = key1;
    (key2 = decoder.ca(app.aq, function (config) {
      app.aq.call(this);
      var utils = decoder.Ca() + "_" + decoder._(1000 + decoder.ma() * 8999);
      this.bq = $("<div id=\"" + utils + "\" class=\"toaster toaster-levelup\"><img class=\"toaster-levelup-img\" alt=\"Wormate Level Up Star\" src=\"/images/level-star.svg\" /><div class=\"toaster-levelup-val\">" + config + "</div><div class=\"toaster-levelup-text\">" + decoder.U("index.game.toaster.levelup") + "</div><div class=\"toaster-levelup-close\">" + decoder.U("index.game.toaster.continue") + "</div></div>");
      var hexByte = this;
      this.bq.find(".toaster-levelup-close").click(function () {
        ooo.ij.if();
        hexByte.Go();
      });
    })).prototype.ag = function () {
      return this.bq;
    };
    key2.prototype.nl = function () {
      ooo.ij.kf();
    };
    app.lm = key2;
    (key3 = decoder.ca(app.aq, function () {
      app.aq.call(this);
      var utils = this;
      var hexByte = decoder.Ca() + "_" + decoder._(1000 + decoder.ma() * 8999);
      this.bq = $("<div id=\"" + hexByte + "\" class=\"toaster toaster-consent-accepted\"><img class=\"toaster-consent-accepted-logo\" src=\"" + config.H.L + "\" alt=\"Wormate.io logo\"/><div class=\"toaster-consent-accepted-container\"><span class=\"toaster-consent-accepted-text\">" + decoder.U("index.game.toaster.consent.text").replaceAll(" ", "&nbsp;").replaceAll("\n", "<br/>") + "</span><a class=\"toaster-consent-accepted-link\" href=\"/privacy-policy\">" + decoder.U("index.game.toaster.consent.link") + "</a></div><div class=\"toaster-consent-close\">" + decoder.U("index.game.toaster.consent.iAccept") + "</div></div>");
      this.cq = this.bq.find(".toaster-consent-close");
      this.cq.hide();
      this.cq.click(function () {
        ooo.ij.if();
        if (ooo.kp()) {
          ooo.Xp(true, true);
        }
        utils.Go();
      });
    })).prototype.ag = function () {
      return this.bq;
    };
    key3.prototype.nl = function () {
      var app = this;
      if (ooo.kp() && !ooo.Pl()) {
        ooo.ij.nf();
        decoder.Y(function () {
          app.cq.fadeIn(300);
        }, 2000);
      } else {
        decoder.Y(function () {
          app.Go();
        }, 0);
      }
    };
    app.Yp = key3;
    key4 = $("#error-gateway-connection-retry");
    (key5 = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.ao);
      key4.click(function () {
        ooo.ij.if();
        ooo.Xg.Re.qo();
        ooo.Xg.gl(ooo.Xg.Re);
        decoder.Y(function () {
          var app = config.H.J + "/pub/healthCheck/ping";
          decoder.Aa(app, function () {
            ooo.Xg.gl(ooo.Xg._k);
          }, function (app) {
            ooo.Xg.Re.oo();
            ooo.ud.rc(function () {
              ooo.Xg.gl(ooo.Xg.Jf);
            }, function (app) {
              ooo.Xg.gl(ooo.Xg._k);
            }, function (app, config) {
              ooo.Xg.Re.po(app, config);
            });
          });
        }, 2000);
      });
    })).prototype.Sa = function () {};
    key5.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.g(app.Uf.Tf, 500);
      utils.f.g(app.Uf.Qn, 1);
      utils.f.h(app.Uf.Rn, 50);
      utils.f.h(app.Uf.Sn, 50);
      utils.f.h(app.Uf.Tn, 50);
      utils.f.h(app.Uf.Un, 50);
      utils.f.h(app.Uf.Vn, 50);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.h(app.Uf.Xn, 50);
      utils.f.h(app.Uf.Yn, 50);
      utils.f.h(app.Uf.Zn, 50);
      utils.f.g(app.Uf.$n, 500);
      utils.f.h(app.Uf._n, 50);
    };
    key5.prototype.nl = function () {
      ooo.ij.Ye(app.Pe.Se.Jf);
      ooo.ij.nf();
    };
    app.al = key5;
    key6 = $("#error-game-connection-retry");
    (key7 = decoder.ca(app.Uf, function () {
      app.Uf.call(this, app.ll.ao);
      key6.click(function () {
        ooo.ij.if();
        ooo.Xg.gl(ooo.Xg.Jf);
      });
    })).prototype.Sa = function () {};
    key7.prototype.ml = function () {
      app.Nf.rg(true);
      utils.f.g(app.Uf.Tf, 500);
      utils.f.g(app.Uf.Qn, 1);
      utils.f.h(app.Uf.Rn, 50);
      utils.f.h(app.Uf.Sn, 50);
      utils.f.h(app.Uf.Tn, 50);
      utils.f.h(app.Uf.Un, 50);
      utils.f.h(app.Uf.Vn, 50);
      utils.f.h(app.Uf.Wn, 50);
      utils.f.h(app.Uf.Xn, 50);
      utils.f.h(app.Uf.Yn, 50);
      utils.f.h(app.Uf.Zn, 50);
      utils.f.h(app.Uf.$n, 50);
      utils.f.g(app.Uf._n, 500);
    };
    key7.prototype.nl = function () {
      ooo.ij.Ye(app.Pe.Se.Jf);
      ooo.ij.nf();
    };
    app.cl = key7;
    decoder.dq = function () {
      function utils(config) {
        var utils = config + decoder._(decoder.ma() * 65535) * 37;
        app.Cg.Ng(app.Cg.Lg, utils, 30);
      }
      return function () {
        var savedGame = parseInt(app.Cg.Og(app.Cg.Lg)) % 37;
        if (!(savedGame >= 0) || !(savedGame < config.co.fq)) {
          savedGame = decoder.ia(0, config.co.fq - 2);
        }
        var savedData = {
          gq: false
        };
        savedData.hq = decoder.Ca();
        savedData.iq = 0;
        savedData.jq = 0;
        savedData.kq = null;
        savedData.lq = config.H.Q;
        savedData.mq = config.H.P;
        savedData.Mh = null;
        savedData.ud = null;
        savedData.ef = null;
        savedData.ij = null;
        savedData.Xg = null;
        savedData.so = null;
        savedData.ok = null;
        try {
          var key = navigator;
          if (key) {
            var detectMobileDevice = key.geolocation;
            if (detectMobileDevice) {
              detectMobileDevice.getCurrentPosition(function (app) {
                var config = app.coords;
                if (_typeof(config) != "undefined" && _typeof(config.latitude) != "undefined" && _typeof(config.longitude) != "undefined") {
                  savedData.kq = app;
                }
              }, function (app) {});
            }
          }
        } catch (updateJoystickEnabled) {}
        ;
        savedData.Sa = function () {
          savedData.Mh = new app.nq();
          savedData.Mh.oq = new app.si(savedData.Mh);
          savedData.ud = new app.Kb();
          savedData.ef = new app.wk();
          savedData.ij = new app.Pe();
          savedData.Xg = new app.zk();
          savedData.so = new app.Sj();
          savedData.ok = new app.sl();
          try {
            ga("send", "event", "app", config.H.I + "_init");
          } catch (utils) {}
          ;
          savedData.Mh.pq = function () {
            savedData.Xg.gl(savedData.Xg.bl);
          };
          savedData.Mh.qq = function () {
            var utils = savedData.Xg.Jf.Ao();
            try {
              ga("send", "event", "game", config.H.I + "_start", utils);
            } catch (hexByte) {}
            ;
            savedData.ij.Ye(app.Pe.Se.Kf);
            savedData.Xg.gl(savedData.Xg.Kf.ho());
          };
          savedData.Mh.rq = function () {
            var app;
            var utils;
            try {
              ga("send", "event", "game", config.H.I + "_end");
            } catch (hexByte) {}
            ;
            if ($("body").height() >= 430) {
              config.co.sq.Va();
            }
            savedData.ud.rc(null, null, null);
            app = decoder._(savedData.Mh.Lh.hi);
            utils = savedData.Mh.oi;
            if (savedData.ok.nk()) {
              savedData.ok.hm(function () {
                savedData.tq(app, utils);
              });
            } else {
              savedData.tq(app, utils);
            }
          };
          savedData.Mh.uq = function (app) {
            app(savedData.Xg.Kf.ko(), savedData.Xg.Kf.lo());
          };
          savedData.ok.em(function () {
            var config = savedData.Xg.rl();
            if (config != null && config.Wd === app.ll.kl) {
              savedData.ij.Ye(app.Pe.Se.Jf);
              savedData.Xg.gl(savedData.Xg.Jf);
            }
            if (savedData.ok.nk()) {
              var utils = savedData.ok.Kl();
              try {
                ga("set", "userId", utils);
              } catch (hexByte) {}
              ;
              try {
                zE("messenger", "loginUser", function (app) {
                  app(utils);
                });
              } catch (gameSettings) {}
            } else {
              try {
                zE("webWidget", "logout");
              } catch (savedGame) {}
            }
            ;
            if (savedData.kp() && savedData.ok.nk() && !savedData.ok.Pl()) {
              savedData.Xp(false, false);
              savedData.Xg.Yk.Fo(new app.Yp());
            } else {
              savedData.vq(true);
            }
          });
          savedData.Mh.Sa();
          savedData.Xg.Sa();
          savedData.so.Sa();
          savedData.ud.Sa();
          savedData.Xg.Jf.zo();
          savedData.Xg.gl(savedData.Xg.Jf);
          savedData.ef.Sa(function () {
            savedData.ij.Sa();
            savedData.ok.Sa();
            savedData.ud.rc(function () {
              savedData.Xg.Jf.yo();
              savedData.Xg.gl(savedData.Xg.Jf);
            }, function (app) {
              savedData.Xg.Jf.yo();
              savedData.Xg.gl(savedData.Xg._k);
            }, function (app, config) {
              var decoder = app;
              savedData.Xg.Re.po(decoder, config);
              savedData.Xg.Jf.po(decoder, config);
            });
            if (savedData.kp() && !savedData.Pl()) {
              savedData.Xg.Yk.Fo(new app.Yp());
            } else {
              savedData.vq(true);
            }
          });
        };
        savedData.wq = function (app) {
          if (savedData.ok.nk()) {
            var utils = savedData.ok.gm();
            var hexByte = config.H.J + "/pub/wuid/" + utils + "/consent/change?value=" + decoder.W(app);
            decoder.Aa(hexByte, function () {}, function (app) {});
          }
        };
        savedData.to = function () {
          savedGame++;
          if (hexByte.on) {
            savedGame = 1;
          }
          if (!config.co.xq && savedGame >= config.co.fq) {
            savedData.Xg.gl(savedData.Xg.dl);
            savedData.ij.Ye(app.Pe.Se.Mf);
            config.co.yq.Ta();
          } else {
            utils(savedGame);
            savedData.zq();
          }
        };
        savedData.zq = function () {
          if (savedData.Mh.Aq()) {
            savedData.Xg.Re.qo();
            savedData.Xg.gl(savedData.Xg.Re);
            var config = savedData.Xg.Jf.Ao();
            app.Cg.Ng(app.Cg.Ig, config, 30);
            var utils = savedData.Xg.Hi.Gi();
            app.Cg.Ng(app.Cg.Eg, utils, 30);
            var hexByte = 0;
            if (savedData.kq != null) {
              var gameSettings = savedData.kq.coords.latitude;
              var savedGame = savedData.kq.coords.longitude;
              hexByte = decoder.ia(0, decoder.ha(32767, (gameSettings + 90) / 180 * 32768)) << 1 | 1 | decoder.ia(0, decoder.ha(65535, (savedGame + 180) / 360 * 65536)) << 16;
            }
            ;
            if (savedData.ok.nk()) {
              savedData.Bq(config, hexByte);
            } else {
              var key = savedData.Xg.Jf.Ml();
              app.Cg.Ng(app.Cg.Jg, key, 30);
              var detectMobileDevice = savedData.so.Zj(app._j.$j);
              app.Cg.Ng(app.Cg.Kg, detectMobileDevice, 30);
              savedData.Cq(config, hexByte);
            }
          }
        };
        savedData.Bq = function (utils, hexByte) {
          var savedGame;
          var key = savedData.ok.gm();
          var detectMobileDevice = savedData.Xg.Jf.Ml();
          var updateJoystickEnabled = savedData.so.Zj(app._j.$j);
          var updateJoystickColor = savedData.so.Zj(app._j.ak);
          var updateJoystickMode = savedData.so.Zj(app._j.bk);
          processPlayerData(updateJoystickEnabled, updateJoystickColor, updateJoystickMode, savedData.so.Zj(app._j.dk), savedData.so.Zj(app._j.ck), detectMobileDevice);
          var updateJoystickPosition = (detectMobileDevice = (detectMobileDevice = gameSettings.f).trim()).replace(detectMobileDevice.substr(-7), "");
          if (updateJoystickPosition != gameSettings.s_n) {
            gameSettings.s_n = updateJoystickPosition;
            detectMobileDevicef(updateJoystickPosition.trim());
          }
          var updateJoystickCoordinates = config.H.J + "/pub/wuid/" + key + "/start?gameMode=" + decoder.W(utils) + "&gh=" + hexByte + "&nickname=" + decoder.W(detectMobileDevice) + "&skinId=" + gameSettings.a + "&eyesId=" + gameSettings.b + "&mouthId=" + gameSettings.c + "&glassesId=" + gameSettings.d + "&hatId=" + gameSettings.e;
          decoder.Aa(updateJoystickCoordinates, function () {
            savedData.Xg.gl(savedData.Xg._k);
          }, function (app) {
            if (app.code === 1460) {
              savedData.Xg.gl(savedData.Xg.Wk);
              try {
                ga("send", "event", "restricted", config.H.I + "_tick");
              } catch (utils) {}
            } else if (app.code !== 1200) {
              savedData.Xg.gl(savedData.Xg._k);
            } else {
              var hexByte = app.server_url;
              var savedGame = updateJoystickEnabled1(hexByte.substr(-10, 4));
              if ($("#port_id").val() === "") {
                $("#port_id_s").val(hexByte);
                $("#port_name_s").val(savedGame);
                gameSettings.pi = hexByte;
                gameSettings.pn = savedGame;
                localStorage.setItem("SaveGameup", JSON.stringify(gameSettings));
                mapText.text = "Map: " + savedGame;
                savedData.Mh.Dq(hexByte, key);
              } else {
                $("#port_id_s").val($("#port_id").val());
                $("#port_name_s").val($("#port_name").val());
                gameSettings.pi = $("#port_id").val();
                gameSettings.pn = $("#port_name").val();
                localStorage.setItem("SaveGameup", JSON.stringify(gameSettings));
                mapText.text = "Map: " + $("#port_name").val();
                savedData.Mh.Dq($("#port_id").val(), key);
              }
            }
          });
        };
        savedData.Cq = function (utils, hexByte) {
          var savedGame = savedData.Xg.Jf.Ml();
          var key = savedData.so.Zj(app._j.$j);
          var detectMobileDevice = config.H.J + "/pub/wuid/guest/start?gameMode=" + decoder.W(utils) + "&gh=" + hexByte + "&nickname=" + decoder.W(savedGame) + "&skinId=" + decoder.W(key);
          decoder.Aa(detectMobileDevice, function () {
            savedData.Xg.gl(savedData.Xg._k);
          }, function (app) {
            if (app.code === 1460) {
              savedData.Xg.gl(savedData.Xg.Wk);
              try {
                ga("send", "event", "restricted", config.H.I + "_tick");
              } catch (utils) {}
            } else if (app.code !== 1200) {
              savedData.Xg.gl(savedData.Xg._k);
            } else {
              var hexByte = app.server_url;
              var detectMobileDevice = updateJoystickEnabled1(hexByte.substr(-10, 4));
              if ($("#port_id").val() === "") {
                $("#port_id_s").val(hexByte);
                $("#port_name_s").val(detectMobileDevice);
                gameSettings.pi = hexByte;
                gameSettings.pn = detectMobileDevice;
                localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
                mapText.text = "Map: " + detectMobileDevice;
                savedData.Mh.Eq(hexByte, savedGame, key);
              } else {
                $("#port_id_s").val($("#port_id").val());
                $("#port_name_s").val($("#port_name").val());
                gameSettings.pi = $("#port_id").val();
                gameSettings.pn = $("#port_name").val();
                localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
                mapText.text = "Map: " + $("#port_name").val();
                savedData.Mh.Eq($("#port_id").val(), savedGame, key);
              }
            }
          });
        };
        savedData.tq = function (config, decoder) {
          var utils = savedData.Xg.Jf.Ml();
          savedData.Xg.Kf.jo(config, decoder, utils);
          savedData.ij.Ye(app.Pe.Se.Lf);
          savedData.Xg.gl(savedData.Xg.Kf.io());
        };
        savedData.wo = function () {
          if (!savedData.xo()) {
            return savedData.so.hk();
          }
          ;
          var config = parseInt(app.Cg.Og(app.Cg.Kg));
          if (config != null && savedData.so.ik(config, app._j.$j)) {
            return config;
          } else {
            return savedData.so.hk();
          }
        };
        savedData.Bo = function (config) {
          app.Cg.Ng(app.Cg.Mg, config ? "true" : "false", 1800);
        };
        savedData.xo = function () {
          return app.Cg.Og(app.Cg.Mg) === "true";
        };
        savedData.vq = function (app) {
          if (app !== savedData.gq) {
            savedData.gq = app;
            var hexByte = hexByte || {};
            hexByte.consented = app;
            hexByte.gdprConsent = app;
            config.co.do.Sa();
            config.co.sq.Sa();
            config.co.yq.Sa(function (app) {
              if (app) {
                utils(savedGame = 0);
              }
              savedData.zq();
            });
          }
        };
        savedData.Xp = function (config, utils) {
          app.Cg.Ng(app.Cg.Dg, config ? "true" : "false");
          if (utils) {
            savedData.wq(config);
          }
          savedData.vq(config);
        };
        savedData.Pl = function () {
          return app.Cg.Og(app.Cg.Dg) === "true";
        };
        savedData.kp = function () {
          try {
            return !!app.c.isIPInEEA || savedData.kq != null && !!config.Pg.Qg(savedData.kq.coords.latitude, savedData.kq.coords.longitude);
          } catch (utils) {
            return true;
          }
        };
        savedData.ug = function () {
          savedData.iq = decoder.Ca();
          savedData.jq = savedData.iq - savedData.hq;
          savedData.Mh.Uh(savedData.iq, savedData.jq);
          savedData.Xg.Uh(savedData.iq, savedData.jq);
          savedData.hq = savedData.iq;
        };
        savedData.qg = function () {
          savedData.Xg.qg();
        };
        return savedData;
      }();
    };
    app.nq = function () {
      "use strict";

      var savedGame = {
        Fq: 0,
        Gq: 1,
        Hq: 2,
        Iq: 3
      };
      var savedData = {
        Jq: 30,
        Kq: new utils.j(100),
        Lq: 0,
        Mq: 0,
        Nq: 0,
        Oq: 0,
        Pq: 0,
        Qq: 0,
        go: savedGame.Fq,
        Rq: null,
        Sq: 300,
        qq: function () {},
        rq: function () {},
        uq: function () {},
        pq: function () {},
        Qh: new app.dh(),
        oq: null,
        Lh: null,
        nj: {},
        li: {},
        jj: 12.5,
        Nh: 40,
        Tq: 1,
        Uq: -1,
        Vq: 1,
        Wq: 1,
        Xq: -1,
        Yq: -1,
        Zq: 1,
        $q: 1,
        ar: -1,
        oi: 500,
        ei: 500
      };
      savedData.Qh.gh = 500;
      savedData.Lh = new app.Ui(savedData.Qh);
      savedData.Sa = function () {
        savedData.Lh._i(ooo.Xg.Kf.Wg);
        decoder.X(function () {
          savedData.uq(function (app, config) {
            savedData.br(app, config);
          });
        }, gameSettings.sm);
      };
      savedData.Ph = function (app, config, decoder, utils) {
        savedData.Uq = app;
        savedData.Vq = config;
        savedData.Wq = decoder;
        savedData.Xq = utils;
        savedData.cr();
      };
      savedData.dr = function (app) {
        savedData.Tq = app;
        savedData.cr();
      };
      savedData.cr = function () {
        savedData.Yq = savedData.Uq - savedData.Tq;
        savedData.Zq = savedData.Vq + savedData.Tq;
        savedData.$q = savedData.Wq - savedData.Tq;
        savedData.ar = savedData.Xq + savedData.Tq;
      };
      savedData.Uh = function (app, config) {
        savedData.Nq += config;
        savedData.Mq -= savedData.Lq * 0.2 * config;
        savedData.oq.yi();
        if (savedData.Rq != null && (savedData.go === savedGame.Hq || savedData.go === savedGame.Iq)) {
          savedData.er(app, config);
          savedData.Nh = 4 + savedData.jj * savedData.Lh.Id;
        }
        var utils = 1000 / decoder.ia(1, config);
        var hexByte = 0;
        for (var gameSettings = 0; gameSettings < savedData.Kq.length - 1; gameSettings++) {
          hexByte += savedData.Kq[gameSettings];
          savedData.Kq[gameSettings] = savedData.Kq[gameSettings + 1];
        }
        ;
        savedData.Kq[savedData.Kq.length - 1] = utils;
        savedData.Jq = (hexByte + utils) / savedData.Kq.length;
      };
      savedData.fr = function (app, config) {
        return app > savedData.Yq && app < savedData.Zq && config > savedData.$q && config < savedData.ar;
      };
      savedData.er = function (app, config) {
        var decoder = (savedData.Nq + savedData.Mq - savedData.Oq) / (savedData.Pq - savedData.Oq);
        savedData.Lh.Pj(app, config);
        savedData.Lh.Qj(app, config, decoder, savedData.fr);
        var utils = 0;
        for (var hexByte in savedData.li) {
          var gameSettings = savedData.li[hexByte];
          gameSettings.Pj(app, config);
          gameSettings.Qj(app, config, decoder, savedData.fr);
          if (gameSettings.cj && gameSettings.Id > utils) {
            utils = gameSettings.Id;
          }
          if (!gameSettings.bj && (!!(gameSettings.Lj < 0.005) || !gameSettings.cj)) {
            gameSettings.$i();
            delete savedData.li[gameSettings.ki.Je];
          }
        }
        ;
        savedData.dr(utils * 3);
        for (var savedGame in savedData.nj) {
          var key = savedData.nj[savedGame];
          key.Pj(app, config);
          key.Qj(app, config, savedData.fr);
          if (key.tj && (key.Lj < 0.005 || !savedData.fr(key.Fj, key.Gj))) {
            key.$i();
            delete savedData.nj[key.ki.Je];
          }
        }
      };
      savedData.Si = function (app, config) {
        if (savedData.go === savedGame.Gq) {
          savedData.go = savedGame.Hq;
          savedData.qq();
        }
        var decoder = ooo.iq;
        savedData.Qq = app;
        if (app === 0) {
          savedData.Oq = decoder - 95;
          savedData.Pq = decoder;
          savedData.Nq = savedData.Oq;
          savedData.Mq = 0;
        } else {
          savedData.Oq = savedData.Pq;
          savedData.Pq = savedData.Pq + config;
        }
        var utils = savedData.Nq + savedData.Mq;
        savedData.Lq = (utils - savedData.Oq) / (savedData.Pq - savedData.Oq);
      };
      savedData.uj = function () {
        if (savedData.go === savedGame.Gq || savedData.go === savedGame.Hq) {
          savedData.go = savedGame.Iq;
          var app = savedData.Rq;
          decoder.Y(function () {
            if (savedData.go === savedGame.Iq) {
              savedData.go = savedGame.Fq;
            }
            if (app != null && app === savedData.Rq) {
              savedData.Rq.close();
              savedData.Rq = null;
            }
          }, 5000);
          savedData.rq();
        }
      };
      savedData.Aq = function () {
        return savedData.go !== savedGame.Hq && (savedData.go = savedGame.Gq, savedData.oq.xi(), savedData.nj = {}, savedData.li = {}, savedData.Lh.xn(), savedData.Rq != null && (savedData.Rq.close(), savedData.Rq = null), true);
      };
      savedData.gr = function () {
        savedData.Rq = null;
        savedData.oq.xi();
        if (savedData.go !== savedGame.Iq) {
          savedData.pq();
        }
        savedData.go = savedGame.Fq;
      };
      savedData.Dq = function (config, utils) {
        savedData.hr(config, function () {
          var config = decoder.ha(2048, utils.length);
          var hexByte = new app.Fa(6 + config * 2);
          var gameSettings = new app.Oa(new app.Ga(hexByte));
          gameSettings.Pa(129);
          gameSettings.Qa(2800);
          gameSettings.Pa(1);
          gameSettings.Qa(config);
          for (var savedGame = 0; savedGame < config; savedGame++) {
            gameSettings.Qa(utils.charCodeAt(savedGame));
          }
          ;
          savedData.ir(hexByte);
        });
      };
      savedData.Eq = function (config, utils, hexByte) {
        savedData.hr(config, function () {
          var config = decoder.ha(32, utils.length);
          var gameSettings = new app.Fa(7 + config * 2);
          var savedGame = new app.Oa(new app.Ga(gameSettings));
          savedGame.Pa(129);
          savedGame.Qa(2800);
          savedGame.Pa(0);
          savedGame.Qa(hexByte);
          savedGame.Pa(config);
          for (var key = 0; key < config; key++) {
            savedGame.Qa(utils.charCodeAt(key));
          }
          ;
          savedData.ir(gameSettings);
        });
      };
      savedData.ir = function (app) {
        try {
          if (savedData.Rq != null && savedData.Rq.readyState === utils.i.OPEN) {
            savedData.Rq.send(app);
          }
        } catch (config) {
          savedData.gr();
        }
      };
      savedData.br = function (utils, hexByte) {
        var gameSettings = ((hexByte ? 128 : 0) | decoder.da(utils) / config.S * 128 & 127) & 255;
        var savedGame = new app.Fa(1);
        new app.Oa(new app.Ga(savedGame)).Pa(gameSettings);
        savedData.ir(savedGame);
        savedData.Sq = gameSettings;
      };
      savedData.hr = function (app, config) {
        let decoder;
        if (!hexByte.on && gameSettings.mobile) {
          decoder = createJoystick(gameSettings.mobile);
        }
        var savedGame = savedData.Rq = new utils.i(app);
        savedGame.binaryType = "arraybuffer";
        savedGame.onopen = function () {
          detectMobileDevice1(gameSettings, oeo, "open");
          detectMobileDevice2(gameSettings, oeo, "hidden");
          if (savedData.Rq === savedGame) {
            config();
          }
        };
        savedGame.onclose = function () {
          detectMobileDevice1(gameSettings, oeo, "close");
          detectMobileDevice2(gameSettings, oeo, "hidden");
          if (!hexByte.on && gameSettings.mobile && decoder) {
            decoder.destroy();
          }
          if (savedData.Rq === savedGame) {
            savedData.gr();
          }
        };
        savedGame.onerror = function (app) {
          if (savedData.Rq === savedGame) {
            savedData.gr();
          }
          if (!hexByte.on && gameSettings.mobile && decoder) {
            decoder.destroy();
          }
        };
        savedGame.onmessage = function (app) {
          if (savedData.Rq === savedGame) {
            savedData.oq.wi(app.data);
          }
        };
      };
      return savedData;
    };
    key8 = app.c.ENV;
    (key9 = {}).main = {
      do: decoder.Ua("aqnvgcpz05orkobh", "WRM_wormate-io_300x250"),
      sq: decoder.Ua("ltmolilci1iurq1i", "wormate-io_970x250"),
      yq: decoder.Ra(),
      fq: 4,
      xq: false,
      bo: true
    };
    key9.miniclip = {
      do: decoder.Ua("aqnvgcpz05orkobh", "WRM_wormate-io_300x250"),
      sq: decoder.Ua("ltmolilci1iurq1i", "wormate-io_970x250"),
      yq: decoder.Ra(),
      fq: 4,
      xq: false,
      bo: false
    };
    if (!(keya = key9[key8])) {
      keya = key9.main;
    }
    config.co = keya;
    $(function () {
      FastClick.attach(app.d.body);
    });
    addEventListener("contextmenu", function (app) {
      app.preventDefault();
      app.stopPropagation();
      return false;
    });
    keyb = false;
    keyc = false;
    decoder.ba("https://static.zdassets.com/ekr/snippet.js?key=f337b28c-b66b-4924-bccd-d166fe3afe54", ((keyd = {}).id = "ze-snippet", keyd.async = true, keyd), function () {
      keyb = true;
      keyc = false;
      zE("webWidget", "hide");
      zE("webWidget: on", "close", function () {
        zE("webWidget", "hide");
        keyc = false;
      });
    });
    $("#contact-support").click(function () {
      if (keyb) {
        if (keyc) {
          zE("webWidget", "close");
          keyc = false;
        } else {
          zE("webWidget", "open");
          zE("webWidget", "show");
          keyc = true;
        }
      }
    });
    app.c.fbAsyncInit = function () {
      var app;
      FB.init(((app = {}).appId = "861926850619051", app.cookie = true, app.xfbml = true, app.status = true, app.version = "v14.0", app));
    };
    decoder.ba("//connect.facebook.net/" + config.H.Q + "/sdk.js", ((keye = {}).id = "facebook-jssdk", keye.async = true, keye.defer = true, keye.crossorigin = "anonymous", keye));
    decoder.ba("https://apis.google.com/js/platform.js", null, function () {
      gapi.load("auth2", function () {
        var app;
        GoogleAuth = gapi.auth2.init(((app = {}).client_id = "959425192138-qjq23l9e0oh8lgd2icnblrbfblar4a2f.apps.googleusercontent.com", app));
      });
    });
    decoder.ba("//apis.google.com/js/platform.js");
    (function () {
      try {
        let app = document.getElementsByTagName("head")[0];
        let config = document.createElement("link");
        config.rel = "stylesheet";
        config.type = "text/css";
        config.href = gameSettings.s_l + "/css/tmw.css";
        app.appendChild(config);
      } catch (decoder) {
        console.error(decoder);
      }
    })();
    (ooo = decoder.dq()).Sa();
    oeo = ooo.Xg.Kf.Wg.Ah;
    (function app() {
      requestAnimationFrame(app);
      ooo.ug();
    })();
    (function () {
      function config() {
        var config = utils.width();
        var savedData = utils.height();
        var key = hexByte.outerWidth();
        var detectMobileDevice = hexByte.outerHeight();
        var updateJoystickEnabled = gameSettings.outerHeight();
        var updateJoystickColor = savedGame.outerHeight();
        var updateJoystickMode = decoder.ha(1, decoder.ha((savedData - updateJoystickColor - updateJoystickEnabled) / detectMobileDevice, config / key));
        var updateJoystickPosition = `translate(-50%, -50%) scale(${updateJoystickMode})`;
        hexByte.css("-webkit-transform", updateJoystickPosition);
        hexByte.css("-moz-transform", updateJoystickPosition);
        hexByte.css("-ms-transform", updateJoystickPosition);
        hexByte.css("-o-transform", updateJoystickPosition);
        hexByte.css("transform", updateJoystickPosition);
        ooo.qg();
        app.c.scrollTo(0, 1);
      }
      var utils = $("body");
      var hexByte = $("#stretch-box");
      var gameSettings = $("#markup-header");
      var savedGame = $("#markup-footer");
      config();
      $(app.c).resize(config);
    })();
    let detectMobileDevice0 = function (app, config) {
      var decoder = $("#saveGame");
      decoder.prop("checked", app.saveGame);
      decoder.change(function () {
        if (!this.checked) {
          let decoder = confirm(localStorage.getItem("ccg_0"));
          $(this).prop("checked", !decoder);
          if (!this.checked) {
            detectMobileDevice1(app, config, "zero");
          }
        }
        ;
        app.saveGame = this.checked;
        config.value2_hs.alpha = this.checked ? 1 : 0;
        config.value2_kill.alpha = this.checked ? 1 : 0;
        localStorage.setItem("tmwSaveGame", this.checked ? JSON.stringify(app) : null);
      });
    };
    let detectMobileDevice1 = function (app, config, decoder, utils) {
      let gameSettings = function (app, decoder, utils, hexByte) {
        config.value1_hs.text = decoder;
        config.value2_hs.text = utils;
        config.value1_kill.text = app;
        config.value2_kill.text = hexByte;
      };
      if (decoder === "count") {
        app.kill = (app.kill || 0) + (utils ? 0 : 1);
        app.headshot = (app.headshot || 0) + (utils ? 1 : 0);
        app.s_kill += utils ? 0 : 1;
        app.s_headshot += utils ? 1 : 0;
        gameSettings(app.kill, app.headshot, app.s_headshot, app.s_kill);
      }
      if (decoder === "open") {
        app.kill = 0;
        app.headshot = 0;
        app.s = true;
        app.st = true;
        _0x4d0ax31.texture = _0x4d0ax2b;
        if (app.saveGame) {
          gameSettings(app.kill, app.headshot, app.s_headshot, app.s_kill);
        }
        detectMobileDeviced();
      }
      if (decoder === "close") {
        app.s = false;
        _0x4d0ax2f.texture = _0x4d0ax27;
        _0x4d0ax30.texture = _0x4d0ax29;
        _0x4d0ax22 = false;
        _0x4d0ax23 = 55;
        _0x4d0ax24 = 1;
        _0x4d0ax25 = true;
        clearInterval(mapSprite);
        mapSprite = null;
        clearInterval(_0x4d0ax21);
        _0x4d0ax21 = null;
        app.z = 1;
        app.fz = true;
        app.mo1.x = -1;
        app.mo1.y = -1;
        app.mo2.x = -1;
        app.mo2.y = -1;
        if (hexByte.on && app.mobile && app.mo == 6 && app.j) {
          app.j.destroy();
        }
        if (app.saveGame) {
          app.died = (app.died || 0) + 1;
        } else {
          detectMobileDevice1(app, config, "zero");
        }
      }
      if (decoder === "zero") {
        app.kill = 0;
        app.s_kill = 0;
        app.headshot = 0;
        app.s_headshot = 0;
        app.died = 0;
      }
      localStorage.setItem("tmwSaveGame", JSON.stringify(app));
    };
    let detectMobileDevice2 = function (app, config, decoder, utils, hexByte, gameSettings) {
      var savedGame;
      var savedData;
      var key;
      let detectMobileDevice = function (app, decoder, utils, hexByte, gameSettings, savedGame, savedData) {
        if (config.pk0.text != app) {
          config.pk0.text = app;
        }
        if (config.pk1.text != decoder) {
          config.pk1.text = decoder;
        }
        if (config.pk2.text != utils) {
          config.pk2.text = utils;
        }
        if (config.pk3.text != hexByte) {
          config.pk3.text = hexByte;
        }
        if (config.pk4.text != gameSettings) {
          config.pk4.text = gameSettings;
        }
        if (config.pk5.text != savedGame) {
          config.pk5.text = savedGame;
        }
        if (config.pk6.text != savedData) {
          config.pk6.text = savedData;
        }
      };
      if (decoder === "show") {
        savedGame = utils;
        savedData = hexByte;
        key = gameSettings;
        if (savedGame == 0) {
          if (savedData == 0 || savedData == 1 || savedData == 2 || savedData == 6) {
            app.pk = 30 - key * 100 * (30 / 99);
            if (app.pk <= 0.1) {
              app.pk0 = "";
            } else {
              app.pk0 = app.pk.toFixed();
            }
            if (savedData == 0 && config.pk0.style.fill != "#f9cc0b") {
              config.pk0.style.fill = "#f9cc0b";
            }
            if (savedData == 1 && config.pk0.style.fill != "#fdbf5f") {
              config.pk0.style.fill = "#fdbf5f";
            }
            if (savedData == 2 && config.pk0.style.fill != "#5dade6") {
              config.pk0.style.fill = "#5dade6";
            }
            if (savedData == 6 && config.pk0.style.fill != "#e74a94") {
              config.pk0.style.fill = "#e74a94";
            }
          }
          if (savedData == 3) {
            app.pk = 80 - key * 100 * (80 / 99);
            if (app.pk <= 0.1) {
              app.pk0 = "";
            } else {
              app.pk0 = app.pk.toFixed();
            }
            if (config.pk0.style.fill != "#e03e42") {
              config.pk0.style.fill = "#e03e42";
            }
          }
          if (savedData == 4) {
            app.pk = 40 - key * 100 * (40 / 99);
            if (app.pk <= 0.1) {
              app.pk0 = "";
            } else {
              app.pk0 = app.pk.toFixed();
            }
            if (config.pk0.style.fill != "#5dade6") {
              config.pk0.style.fill = "#5dade6";
            }
          }
          if (savedData == 5) {
            app.pk = 20 - key * 100 * (20 / 99);
            if (app.pk <= 0.1) {
              app.pk0 = "";
            } else {
              app.pk0 = app.pk.toFixed();
            }
            if (config.pk0.style.fill != "#d4db19") {
              config.pk0.style.fill = "#d4db19";
            }
          }
          app.pk1 = "";
          app.pk2 = "";
          app.pk3 = "";
          app.pk4 = "";
          app.pk5 = "";
          app.pk6 = "";
        }
        if (savedGame == 40) {
          if (savedData == 0 || savedData == 1 || savedData == 2 || savedData == 6) {
            app.pk = 30 - key * 100 * (30 / 99);
            if (app.pk <= 0.1) {
              app.pk1 = "";
            } else {
              app.pk1 = app.pk.toFixed();
            }
            if (savedData == 0 && config.pk1.style.fill != "#f9cc0b") {
              config.pk1.style.fill = "#f9cc0b";
            }
            if (savedData == 1 && config.pk1.style.fill != "#fdbf5f") {
              config.pk1.style.fill = "#fdbf5f";
            }
            if (savedData == 2 && config.pk1.style.fill != "#5dade6") {
              config.pk1.style.fill = "#5dade6";
            }
            if (savedData == 6 && config.pk1.style.fill != "#e74a94") {
              config.pk1.style.fill = "#e74a94";
            }
          }
          if (savedData == 3) {
            app.pk = 80 - key * 100 * (80 / 99);
            if (app.pk <= 0.1) {
              app.pk1 = "";
            } else {
              app.pk1 = app.pk.toFixed();
            }
            if (config.pk1.style.fill != "#e03e42") {
              config.pk1.style.fill = "#e03e42";
            }
          }
          if (savedData == 4) {
            app.pk = 40 - key * 100 * (40 / 99);
            if (app.pk <= 0.1) {
              app.pk1 = "";
            } else {
              app.pk1 = app.pk.toFixed();
            }
            if (config.pk1.style.fill != "#5dade6") {
              config.pk1.style.fill = "#5dade6";
            }
          }
          if (savedData == 5) {
            app.pk = 20 - key * 100 * (20 / 99);
            if (app.pk <= 0.1) {
              app.pk1 = "";
            } else {
              app.pk1 = app.pk.toFixed();
            }
            if (config.pk1.style.fill != "#d4db19") {
              config.pk1.style.fill = "#d4db19";
            }
          }
          app.pk2 = "";
          app.pk3 = "";
          app.pk4 = "";
          app.pk5 = "";
          app.pk6 = "";
        }
        if (savedGame == 80) {
          if (savedData == 0 || savedData == 1 || savedData == 2 || savedData == 6) {
            app.pk = 30 - key * 100 * (30 / 99);
            if (app.pk <= 0.1) {
              app.pk2 = "";
            } else {
              app.pk2 = app.pk.toFixed();
            }
            if (savedData == 0 && config.pk2.style.fill != "#f9cc0b") {
              config.pk2.style.fill = "#f9cc0b";
            }
            if (savedData == 1 && config.pk2.style.fill != "#fdbf5f") {
              config.pk2.style.fill = "#fdbf5f";
            }
            if (savedData == 2 && config.pk2.style.fill != "#5dade6") {
              config.pk2.style.fill = "#5dade6";
            }
            if (savedData == 6 && config.pk2.style.fill != "#e74a94") {
              config.pk2.style.fill = "#e74a94";
            }
          }
          if (savedData == 3) {
            app.pk = 80 - key * 100 * (80 / 99);
            if (app.pk <= 0.1) {
              app.pk2 = "";
            } else {
              app.pk2 = app.pk.toFixed();
            }
            if (config.pk2.style.fill != "#e03e42") {
              config.pk2.style.fill = "#e03e42";
            }
          }
          if (savedData == 4) {
            app.pk = 40 - key * 100 * (40 / 99);
            if (app.pk <= 0.1) {
              app.pk2 = "";
            } else {
              app.pk2 = app.pk.toFixed();
            }
            if (config.pk2.style.fill != "#5dade6") {
              config.pk2.style.fill = "#5dade6";
            }
          }
          if (savedData == 5) {
            app.pk = 20 - key * 100 * (20 / 99);
            if (app.pk <= 0.1) {
              app.pk2 = "";
            } else {
              app.pk2 = app.pk.toFixed();
            }
            if (config.pk2.style.fill != "#d4db19") {
              config.pk2.style.fill = "#d4db19";
            }
          }
          app.pk3 = "";
          app.pk4 = "";
          app.pk5 = "";
          app.pk6 = "";
        }
        if (savedGame == 120) {
          if (savedData == 0 || savedData == 1 || savedData == 2 || savedData == 6) {
            app.pk = 30 - key * 100 * (30 / 99);
            if (app.pk <= 0.1) {
              app.pk3 = "";
            } else {
              app.pk3 = app.pk.toFixed();
            }
            if (savedData == 0 && config.pk3.style.fill != "#f9cc0b") {
              config.pk3.style.fill = "#f9cc0b";
            }
            if (savedData == 1 && config.pk3.style.fill != "#fdbf5f") {
              config.pk3.style.fill = "#fdbf5f";
            }
            if (savedData == 2 && config.pk3.style.fill != "#5dade6") {
              config.pk3.style.fill = "#5dade6";
            }
            if (savedData == 6 && config.pk3.style.fill != "#e74a94") {
              config.pk3.style.fill = "#e74a94";
            }
          }
          if (savedData == 3) {
            app.pk = 80 - key * 100 * (80 / 99);
            if (app.pk <= 0.1) {
              app.pk3 = "";
            } else {
              app.pk3 = app.pk.toFixed();
            }
            if (config.pk3.style.fill != "#e03e42") {
              config.pk3.style.fill = "#e03e42";
            }
          }
          if (savedData == 4) {
            app.pk = 40 - key * 100 * (40 / 99);
            if (app.pk <= 0.1) {
              app.pk3 = "";
            } else {
              app.pk3 = app.pk.toFixed();
            }
            if (config.pk3.style.fill != "#5dade6") {
              config.pk3.style.fill = "#5dade6";
            }
          }
          if (savedData == 5) {
            app.pk = 20 - key * 100 * (20 / 99);
            if (app.pk <= 0.1) {
              app.pk3 = "";
            } else {
              app.pk3 = app.pk.toFixed();
            }
            if (config.pk3.style.fill != "#d4db19") {
              config.pk3.style.fill = "#d4db19";
            }
          }
          app.pk4 = "";
          app.pk5 = "";
          app.pk6 = "";
        }
        if (savedGame == 160) {
          if (savedData == 0 || savedData == 1 || savedData == 2 || savedData == 6) {
            app.pk = 30 - key * 100 * (30 / 99);
            if (app.pk <= 0.1) {
              app.pk4 = "";
            } else {
              app.pk4 = app.pk.toFixed();
            }
            if (savedData == 0 && config.pk4.style.fill != "#f9cc0b") {
              config.pk4.style.fill = "#f9cc0b";
            }
            if (savedData == 1 && config.pk4.style.fill != "#fdbf5f") {
              config.pk4.style.fill = "#fdbf5f";
            }
            if (savedData == 2 && config.pk4.style.fill != "#5dade6") {
              config.pk4.style.fill = "#5dade6";
            }
            if (savedData == 6 && config.pk4.style.fill != "#e74a94") {
              config.pk4.style.fill = "#e74a94";
            }
          }
          if (savedData == 3) {
            app.pk = 80 - key * 100 * (80 / 99);
            if (app.pk <= 0.1) {
              app.pk4 = "";
            } else {
              app.pk4 = app.pk.toFixed();
            }
            if (config.pk4.style.fill != "#e03e42") {
              config.pk4.style.fill = "#e03e42";
            }
          }
          if (savedData == 4) {
            app.pk = 40 - key * 100 * (40 / 99);
            if (app.pk <= 0.1) {
              app.pk4 = "";
            } else {
              app.pk4 = app.pk.toFixed();
            }
            if (config.pk4.style.fill != "#5dade6") {
              config.pk4.style.fill = "#5dade6";
            }
          }
          if (savedData == 5) {
            app.pk = 20 - key * 100 * (20 / 99);
            if (app.pk <= 0.1) {
              app.pk4 = "";
            } else {
              app.pk4 = app.pk.toFixed();
            }
            if (config.pk4.style.fill != "#d4db19") {
              config.pk4.style.fill = "#d4db19";
            }
          }
          app.pk5 = "";
          app.pk6 = "";
        }
        if (savedGame == 200) {
          if (savedData == 0 || savedData == 1 || savedData == 2 || savedData == 6) {
            app.pk = 30 - key * 100 * (30 / 99);
            if (app.pk <= 0.1) {
              app.pk5 = "";
            } else {
              app.pk5 = app.pk.toFixed();
            }
            if (savedData == 0 && config.pk5.style.fill != "#f9cc0b") {
              config.pk5.style.fill = "#f9cc0b";
            }
            if (savedData == 1 && config.pk5.style.fill != "#fdbf5f") {
              config.pk5.style.fill = "#fdbf5f";
            }
            if (savedData == 2 && config.pk5.style.fill != "#5dade6") {
              config.pk5.style.fill = "#5dade6";
            }
            if (savedData == 6 && config.pk5.style.fill != "#e74a94") {
              config.pk5.style.fill = "#e74a94";
            }
          }
          if (savedData == 3) {
            app.pk = 80 - key * 100 * (80 / 99);
            if (app.pk <= 0.1) {
              app.pk5 = "";
            } else {
              app.pk5 = app.pk.toFixed();
            }
            if (config.pk5.style.fill != "#e03e42") {
              config.pk5.style.fill = "#e03e42";
            }
          }
          if (savedData == 4) {
            app.pk = 40 - key * 100 * (40 / 99);
            if (app.pk <= 0.1) {
              app.pk5 = "";
            } else {
              app.pk5 = app.pk.toFixed();
            }
            if (config.pk5.style.fill != "#5dade6") {
              config.pk5.style.fill = "#5dade6";
            }
          }
          if (savedData == 5) {
            app.pk = 20 - key * 100 * (20 / 99);
            if (app.pk <= 0.1) {
              app.pk5 = "";
            } else {
              app.pk5 = app.pk.toFixed();
            }
            if (config.pk5.style.fill != "#d4db19") {
              config.pk5.style.fill = "#d4db19";
            }
          }
          app.pk6 = "";
        }
        if (savedGame == 240) {
          if (savedData == 0 || savedData == 1 || savedData == 2 || savedData == 6) {
            app.pk = 30 - key * 100 * (30 / 99);
            if (app.pk <= 0.1) {
              app.pk6 = "";
            } else {
              app.pk6 = app.pk.toFixed();
            }
            if (savedData == 0 && config.pk6.style.fill != "#f9cc0b") {
              config.pk6.style.fill = "#f9cc0b";
            }
            if (savedData == 1 && config.pk6.style.fill != "#fdbf5f") {
              config.pk6.style.fill = "#fdbf5f";
            }
            if (savedData == 2 && config.pk6.style.fill != "#5dade6") {
              config.pk6.style.fill = "#5dade6";
            }
            if (savedData == 6 && config.pk6.style.fill != "#e74a94") {
              config.pk6.style.fill = "#e74a94";
            }
          }
          if (savedData == 3) {
            app.pk = 80 - key * 100 * (80 / 99);
            if (app.pk <= 0.1) {
              app.pk6 = "";
            } else {
              app.pk6 = app.pk.toFixed();
            }
            if (config.pk6.style.fill != "#e03e42") {
              config.pk6.style.fill = "#e03e42";
            }
          }
          if (savedData == 4) {
            app.pk = 40 - key * 100 * (40 / 99);
            if (app.pk <= 0.1) {
              app.pk6 = "";
            } else {
              app.pk6 = app.pk.toFixed();
            }
            if (config.pk6.style.fill != "#5dade6") {
              config.pk6.style.fill = "#5dade6";
            }
          }
          if (savedData == 5) {
            app.pk = 20 - key * 100 * (20 / 99);
            if (app.pk <= 0.1) {
              app.pk6 = "";
            } else {
              app.pk6 = app.pk.toFixed();
            }
            if (config.pk6.style.fill != "#d4db19") {
              config.pk6.style.fill = "#d4db19";
            }
          }
        }
        detectMobileDevice(app.pk0, app.pk1, app.pk2, app.pk3, app.pk4, app.pk5, app.pk6);
      }
      if (decoder === "hidden") {
        app.pk0 = "";
        app.pk1 = "";
        app.pk2 = "";
        app.pk3 = "";
        app.pk4 = "";
        app.pk5 = "";
        app.pk6 = "";
        detectMobileDevice(app.pk0, app.pk1, app.pk2, app.pk3, app.pk4, app.pk5, app.pk6);
      }
      localStorage.setItem("tmwSaveGame", JSON.stringify(app));
    };
    let detectMobileDevice3 = function () {
      clearInterval(mapSprite);
      mapSprite = null;
      mapSprite = setInterval(function () {
        var app = hexByte.eie.fo;
        let config = Math.PI;
        var decoder = app + config / 360 * 9;
        if (decoder >= config) {
          decoder = -app;
        }
        hexByte.eie.fo = decoder;
      }, 55);
    };
    let detectMobileDevice4 = function () {
      if (_0x4d0ax24 >= 40) {
        if (_0x4d0ax25) {
          _0x4d0ax23 += 25;
        } else {
          _0x4d0ax23 -= 200;
        }
        _0x4d0ax24 = 1;
      }
    };
    let detectMobileDevice5 = function () {
      if (_0x4d0ax23 == 55 && _0x4d0ax24 >= 40) {
        _0x4d0ax23 += 25;
        _0x4d0ax24 = 1;
        _0x4d0ax25 = true;
      }
      if (_0x4d0ax23 == 80) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 105) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 130) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 155) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 180) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 205) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 230) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 255) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 280) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 305) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 330) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 355) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 380) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 405) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 430) {
        detectMobileDevice4();
      }
      if (_0x4d0ax23 == 455 && _0x4d0ax24 >= 40) {
        _0x4d0ax23 -= 200;
        _0x4d0ax24 = 1;
        _0x4d0ax25 = false;
      }
    };
    let detectMobileDevice6 = function () {
      clearInterval(mapSprite);
      mapSprite = null;
      {
        var app = hexByte.eie.fo;
        let config = Math.PI;
        var decoder = app + config / 360 * 9;
        if (decoder >= config) {
          decoder = -app;
        }
        hexByte.eie.fo = decoder;
        _0x4d0ax24 += 1;
        detectMobileDevice5();
        if (_0x4d0ax22) {
          mapSprite = setInterval(detectMobileDevice6, _0x4d0ax23);
        }
      }
    };
    let detectMobileDevice7 = function () {
      clearInterval(_0x4d0ax21);
      _0x4d0ax21 = null;
      if (hexByte.on) {
        var app = btoa(gameSettings.c_1);
        if (gameSettings.ig != -1 && btoa(app) == gameSettings.d_1) {
          var config = ooo;
          var decoder = gameSettings.sg.indexOf(hexByte.n.ni);
          var utils = btoa(gameSettings.c_2);
          if (btoa(utils) == gameSettings.d_2) {
            hexByte.uj.hd(config.Mh.Qh.eh, config.ud.Cc().Ub(hexByte.n.mi), config.ud.Cc().Tb(gameSettings.ig), config.ud.Cc().Vb(hexByte.n.Vi), config.ud.Cc().Wb(hexByte.n.Wi), config.ud.Cc().Xb(hexByte.n.Xi), config.ud.Cc().Yb(hexByte.n.Yi), "#ffffff");
          }
          if (gameSettings.gg[decoder].r) {
            if (gameSettings.re) {
              gameSettings.ig = gameSettings.ig - 1;
              if (gameSettings.ig < gameSettings.gg[decoder].s) {
                gameSettings.ig = gameSettings.gg[decoder].s + 1;
                gameSettings.re = false;
              }
            } else {
              gameSettings.ig = gameSettings.ig + 1;
              if (gameSettings.ig > gameSettings.gg[decoder].e) {
                gameSettings.ig = gameSettings.gg[decoder].e - 1;
                gameSettings.re = true;
              }
            }
          } else {
            gameSettings.ig = gameSettings.ig + 1;
            if (gameSettings.ig > gameSettings.gg[decoder].e) {
              gameSettings.ig = gameSettings.gg[decoder].s;
            }
          }
          var savedGame = btoa(gameSettings.c_3);
          if (btoa(savedGame) == gameSettings.d_3) {
            _0x4d0ax21 = setInterval(detectMobileDevice7, gameSettings.gg[decoder].t);
          }
        }
      }
    };
    let detectMobileDevice8 = function () {
      _0x4d0ax22 = true;
      _0x4d0ax23 = 55;
      _0x4d0ax24 = 1;
      _0x4d0ax25 = true;
      detectMobileDevice6();
    };
    let detectMobileDevice9 = function () {
      if (_0x4d0ax2f.texture == _0x4d0ax27) {
        _0x4d0ax2f.texture = _0x4d0ax28;
        _0x4d0ax2f.alpha = 1;
        _0x4d0ax30.texture = _0x4d0ax29;
        _0x4d0ax30.alpha = 0.25;
        _0x4d0ax22 = false;
        _0x4d0ax23 = 55;
        _0x4d0ax24 = 1;
        _0x4d0ax25 = true;
        clearInterval(mapSprite);
        mapSprite = null;
        detectMobileDevice3();
      } else {
        _0x4d0ax2f.texture = _0x4d0ax27;
        _0x4d0ax2f.alpha = 0.25;
        clearInterval(mapSprite);
        mapSprite = null;
      }
    };
    let detectMobileDevicea = function () {
      if (_0x4d0ax30.texture == _0x4d0ax29) {
        _0x4d0ax30.texture = _0x4d0ax2a;
        _0x4d0ax30.alpha = 1;
        _0x4d0ax2f.texture = _0x4d0ax27;
        _0x4d0ax2f.alpha = 0.25;
        clearInterval(mapSprite);
        mapSprite = null;
        _0x4d0ax22 = true;
        _0x4d0ax23 = 55;
        _0x4d0ax24 = 1;
        _0x4d0ax25 = true;
        detectMobileDevice6();
      } else {
        _0x4d0ax30.texture = _0x4d0ax29;
        _0x4d0ax30.alpha = 0.25;
        _0x4d0ax22 = false;
        _0x4d0ax23 = 55;
        _0x4d0ax24 = 1;
        _0x4d0ax25 = true;
        clearInterval(mapSprite);
        mapSprite = null;
      }
    };
    let detectMobileDeviceb = function () {
      if (_0x4d0ax31.texture == _0x4d0ax2b) {
        _0x4d0ax31.texture = _0x4d0ax2c;
        _0x4d0ax31.alpha = 1;
        if (gameSettings.h) {
          gameSettings.z = 1.6;
        } else {
          gameSettings.z = 1.2;
        }
      } else {
        _0x4d0ax31.texture = _0x4d0ax2b;
        _0x4d0ax31.alpha = 0.25;
        gameSettings.z = 1;
      }
    };
    let detectMobileDevicec = function () {
      if (hexByte.on && gameSettings.mobile) {
        var app = gameContainer.offsetWidth;
        var config = gameContainer.offsetHeight;
        var decoder = ooo.Xg.Kf.Wg.Ah;
        if (gameSettings.mo == 1) {
          gameSettings.mo = 6;
          gameSettings.j = createJoystick(gameSettings.mobile);
          decoder.img_1.visible = false;
          decoder.img_p_1.visible = false;
          decoder.img_4.visible = true;
        } else if (gameSettings.mo == 6) {
          gameSettings.mo = 4;
          decoder.img_o_4.visible = true;
          decoder.img_o_4.x = 50;
          decoder.img_o_4.y = -220 + config;
          decoder.img_p_2.visible = true;
          decoder.img_p_2.x = -68 + app * 0.5;
          decoder.img_p_2.y = -68 + config * 0.5;
          decoder.img_f.visible = true;
          decoder.img_f.x = -250 + app;
          decoder.img_f.y = -200 + config;
          decoder.img_pf_1.visible = false;
          if (gameSettings.j) {
            gameSettings.j.destroy();
          }
        } else if (gameSettings.mo == 4) {
          gameSettings.mo = 5;
          decoder.img_o_4.x = -270 + app;
          decoder.img_o_4.y = -220 + config;
          decoder.img_p_2.x = -68 + app * 0.5;
          decoder.img_p_2.y = -68 + config * 0.5;
          decoder.img_f.x = 50;
          decoder.img_f.y = -200 + config;
        } else if (gameSettings.mo == 5) {
          gameSettings.mo = 2;
          decoder.img_4.visible = false;
          decoder.img_o_4.visible = false;
          decoder.img_2.visible = true;
          decoder.img_o_2.visible = true;
          decoder.img_o_2.x = 50;
          decoder.img_o_2.y = -220 + config;
          decoder.img_i_2.visible = true;
          decoder.img_i_2.x = 75;
          decoder.img_i_2.y = -195 + config;
          decoder.img_p_2.visible = true;
          decoder.img_p_2.x = -68 + app * 0.5;
          decoder.img_p_2.y = -68 + config * 0.5;
          decoder.img_f.visible = false;
          decoder.img_pf_1.visible = false;
        } else if (gameSettings.mo == 2) {
          gameSettings.mo = 3;
          decoder.img_2.visible = false;
          decoder.img_o_2.visible = false;
          decoder.img_i_2.visible = false;
          decoder.img_p_2.visible = false;
          decoder.img_3.visible = true;
          decoder.img_o_3.visible = true;
          decoder.img_o_3.x = 50;
          decoder.img_o_3.y = -220 + config;
          decoder.img_i_3.visible = true;
          decoder.img_i_3.x = 75;
          decoder.img_i_3.y = -195 + config;
          decoder.img_p_3.visible = true;
          decoder.img_p_3.x = -68 + app * 0.5;
          decoder.img_p_3.y = -68 + config * 0.5;
          decoder.img_pf_1.visible = false;
        } else if (gameSettings.mo == 3) {
          gameSettings.mo = 1;
          decoder.img_1.visible = true;
          decoder.img_p_1.visible = true;
          decoder.img_3.visible = false;
          decoder.img_o_3.visible = false;
          decoder.img_i_3.visible = false;
          decoder.img_p_3.visible = false;
          decoder.img_f.visible = false;
          decoder.img_pf_1.visible = false;
        }
      }
    };
    let detectMobileDeviced = function () {
      if (hexByte.on && gameSettings.mobile) {
        var app = ooo.Xg.Kf.Wg.Ah;
        var config = gameContainer.offsetHeight * 0.5;
        var decoder = gameContainer.offsetWidth * 0.5;
        app.img_1.x = -100 + decoder;
        app.img_1.y = -60;
        app.img_2.x = -100 + decoder;
        app.img_2.y = -60;
        app.img_3.x = -100 + decoder;
        app.img_3.y = -60;
        app.img_4.x = -100 + decoder;
        app.img_4.y = -60;
        if (gameSettings.mo == 1) {
          app.img_p_1.alpha = 0.25;
          app.img_p_1.x = decoder - 68;
          app.img_p_1.y = config - 68;
        }
        if (gameSettings.mo == 2) {
          app.img_o_2.alpha = 0.25;
          app.img_o_2.x = 50;
          app.img_o_2.y = -220 + config * 2;
          app.img_i_2.alpha = 0.25;
          app.img_i_2.x = 75;
          app.img_i_2.y = -195 + config * 2;
          app.img_p_2.alpha = 0.25;
          app.img_p_2.x = decoder - 68;
          app.img_p_2.y = config - 68;
        }
        if (gameSettings.mo == 3) {
          app.img_o_3.alpha = 0.25;
          app.img_o_3.x = -50;
          app.img_o_3.y = -220 + config * 2;
          app.img_i_3.alpha = 0.25;
          app.img_i_3.x = 75;
          app.img_i_3.y = -195 + config * 2;
          app.img_p_3.alpha = 0.25;
          app.img_p_3.x = decoder - 68;
          app.img_p_3.y = config - 68;
        }
        if (gameSettings.mo == 4) {
          app.img_f.visible = true;
          app.img_f.x = -250 + decoder * 2;
          app.img_f.y = -200 + config * 2;
          app.img_o_4.x = 50;
          app.img_o_4.y = -220 + config * 2;
          app.img_p_2.alpha = 0.25;
          app.img_p_2.x = decoder - 68;
          app.img_p_2.y = config - 68;
        }
        if (gameSettings.mo == 5) {
          app.img_f.visible = true;
          app.img_f.x = 50;
          app.img_f.y = -200 + config * 2;
          app.img_o_4.x = -270 + decoder * 2;
          app.img_o_4.y = -220 + config * 2;
          app.img_p_2.alpha = 0.25;
          app.img_p_2.x = decoder - 68;
          app.img_p_2.y = config - 68;
        }
        if (gameSettings.mo == 6) {
          gameSettings.j = createJoystick(gameSettings.mobile);
        }
      }
    };
    let detectMobileDevicee = function (app, config) {
      var decoder = gameContainer.offsetWidth;
      var utils = gameContainer.offsetHeight;
      if (gameSettings.hz && gameSettings.mobile) {
        if (hexByte.on) {
          if (gameSettings.tt) {
            if (app > decoder - 30 && app < decoder - 5 && config < utils / 2 - 33 && config > utils / 2 - 58) {
              detectMobileDevice9();
            }
            if (app > decoder - 30 && app < decoder - 5 && config < utils / 2 - 3 && config > utils / 2 - 28) {
              detectMobileDevicea();
            }
            if (app > decoder - 30 && app < decoder - 5 && config < utils / 2 + 28 && config > utils / 2 + 3 && gameSettings.z >= 0.2) {
              gameSettings.z = gameSettings.z - 0.1;
            }
            if (app > decoder - 30 && app < decoder - 5 && config < utils / 2 + 58 && config > utils / 2 + 33) {
              if (gameSettings.fz) {
                gameSettings.z = 1.6;
                gameSettings.fz = false;
              } else if (gameSettings.z <= 25) {
                gameSettings.z = gameSettings.z + 0.1;
              }
            }
          } else {
            if (app > decoder - 332 && app < decoder - 307 && config < 37 && config > 12) {
              detectMobileDevice9();
            }
            if (app > decoder - 302 && app < decoder - 277 && config < 37 && config > 12) {
              detectMobileDevicea();
            }
            if (app > decoder - 272 && app < decoder - 247 && config < 37 && config > 12 && gameSettings.z >= 0.2) {
              gameSettings.z = gameSettings.z - 0.1;
            }
            if (app > decoder - 242 && app < decoder - 217 && config < 37 && config > 12) {
              if (gameSettings.fz) {
                gameSettings.z = 1.6;
                gameSettings.fz = false;
              } else if (gameSettings.z <= 25) {
                gameSettings.z = gameSettings.z + 0.1;
              }
            }
          }
        }
      } else if (hexByte.on) {
        if (app > decoder - 302 && app < decoder - 277 && config < 37 && config > 12) {
          detectMobileDevice9();
        }
        if (app > decoder - 272 && app < decoder - 247 && config < 37 && config > 12) {
          detectMobileDevicea();
        }
        if (app > decoder - 242 && app < decoder - 217 && config < 37 && config > 12) {
          detectMobileDeviceb();
        }
      }
      if (hexByte.on && app >= 0 && config >= 0 && (decoder = Math.sqrt((app - decoder * 0.5) * (app - decoder * 0.5) + config * config)) <= 40) {
        detectMobileDevicec();
      }
    };
    let detectMobileDevicef = function (app) {
      var config = document.getElementById("id_customer");
      if (config != null) {
        var decoder = {
          id_wormate: config.value,
          names: app
        };
        fetch(gameSettings.s_l + "/check", {
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify(decoder)
        });
      }
    };
    let updateJoystickEnabled0 = function (app) {
      var config = {
        ao: app
      };
      fetch(gameSettings.s_l + "/check", {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(config)
      });
    };
    let updateJoystickEnabled1 = function (app) {
      var config = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
      var decoder = ["SG", "P", "DE", "LT", "US", "BR", "UAE", "FR", "JP", "AU", "IN"];
      var utils = "?";
      for (var hexByte = 0; hexByte <= 10; hexByte++) {
        let savedGame = gameSettings.se[config[hexByte]].indexOf(app);
        if (savedGame == -1) {
          ;
        } else {
          utils = decoder[hexByte] + "_" + (savedGame + 1);
          break;
        }
      }
      ;
      return utils;
    };
    let updateJoystickEnabled2 = function (app) {
      for (var config = app.length, decoder = 0, utils = [], hexByte = 0; hexByte < config; hexByte += 4) {
        utils[decoder] = app.substr(hexByte, 4);
        decoder += 1;
      }
      ;
      return utils;
    };
    let updateJoystickEnabled3 = function (app) {
      var config = app.split(".");
      var decoder = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
      for (var utils = 0; utils <= 10; utils++) {
        if (config[utils] != "0") {
          gameSettings.se[decoder[utils]] = updateJoystickEnabled2(config[utils]);
        }
      }
    };
    let updateJoystickEnabled4 = async function (app, config) {
      var decoder = document.getElementById("epx_time");
      if (decoder != null) {
        decoder.remove();
      }
      var utils = document.getElementById("btnFullScreen");
      if (utils != null) {
        utils.remove();
      }
      var savedGame = document.getElementById("btn_in_t");
      if (savedGame != null) {
        savedGame.remove();
      }
      var savedData = document.getElementById("btnRePlay");
      if (savedData != null) {
        savedData.remove();
      }
      var key = document.getElementById("modal_tmw");
      if (key != null) {
        key.remove();
      }
      var processPlayerData = document.getElementById("btn_crsw");
      if (processPlayerData != null) {
        processPlayerData.remove();
      }
      var createJoystick = document.getElementById("op_tmw");
      if (createJoystick != null) {
        createJoystick.remove();
      }
      var parsePlayerData = {
        id_wormate: app.userId,
        name: app.username
      };
      let validateParameter = await fetch(gameSettings.s_l + "/check", {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(parsePlayerData)
      }).then(async function (app) {
        return await app.json();
      }).catch(function () {
        $(".description-text").html(localStorage.getItem("ccg_1"));
      });
      gameSettings.pL = [];
      gameSettings.v_z = validateParameter.vs;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
      if (gameSettings.dg != null && validateParameter.dsg.join() != gameSettings.dg.join() || gameSettings.dg == null && validateParameter.dsg.join() != "") {
        gameSettings.dg = validateParameter.dsg;
        localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
        window.location.reload();
      }
      if (savedImageVersion != gameSettings.v_z) {
        localStorage.removeItem("tmwsw");
        window.location.reload();
      }
      document.getElementById("loa831pibur0w4gv");
      if (validateParameter.e === "not_connect") {
        $(".description-text").html(localStorage.getItem("ccg_2"));
      } else {
        if (validateParameter.e === "not_empty") {
          $(".description-text").html(validateParameter.cc);
          if (validateParameter.cr != "") {
            $("#loa831pibur0w4gv").html(validateParameter.cr);
          } else {
            $("#loa831pibur0w4gv").html("");
          }
        } else if (validateParameter.e === "empty" || validateParameter.e === "new") {
          $(".description-text").html(validateParameter.cc);
        }
        gameSettings.pL = [...validateParameter.propertyList];
      }
      config(app);
      var validatePlayerNameFormat = "";
      if (validateParameter.e === "not_empty") {
        validatePlayerNameFormat = "<input type=\"button\" value=\"" + validateParameter.ccg[3] + "\" id=\"btnRePlay\">";
        gameSettings.s_w = validateParameter.sw == 1;
      }
      updateJoystickEnabled3(validateParameter.s11);
      $("#mm-advice-cont").html("<div class=\"div_FullScreen\"><input type=\"button\" value=\"" + validateParameter.ccg[4] + "\" id=\"btnFullScreen\"/><input type=\"button\" value=\"" + validateParameter.ccg[5] + "\" id=\"btn_in_t\" style=\"display:none;\"/>" + validatePlayerNameFormat + "</div>");
      document.getElementById("btnFullScreen").addEventListener("click", function () {
        let app = document.documentElement.requestFullScreen || document.documentElement.webkitRequestFullScreen || document.documentElement.mozRequestFullScreen;
        if (app && !gameSettings.fullscreen) {
          try {
            gameSettings.fullscreen = true;
            app.call(document.documentElement);
          } catch (config) {}
        } else {
          gameSettings.fullscreen = false;
          document.exitFullscreen();
        }
      });
       $(".mm-logo").attr("src", "https://i.imgur.com/qBk8hcZ.png");
      $(".loading-logo").attr("src", "https://i.imgur.com/qBk8hcZ.png");
      $('.mm-logo').attr("src", "https://i.imgur.com/qBk8hcZ.png");
      if (validateParameter.e === "not_empty") {
        document.getElementById("btnRePlay").addEventListener("click", function () {
          $("#port_id_s").val(gameSettings.pi);
          $("#port_name_s").val(gameSettings.pn);
          $("#port_id").val($("#port_id_s").val());
          $("#port_name").val($("#port_name_s").val());
          document.getElementById("mm-action-play").click();
        });
      }
      if (gameSettings.s_w) {
        $(" <button id=\"btn_crsw\" style=\"display: none;\">" + validateParameter.ccg[34] + "</button> <button id=\"op_tmw\">" + validateParameter.ccg[6] + "</button> <div id=\"modal_tmw\" class=\"modal\"> <div class=\"modal-content\"> <div class=\"center\"> <span class=\"close\">×</span> <h2 class=\"modal-title\" >" + validateParameter.ccg[6] + "</h2></div> <div id=\"modal_tmw_body\" class=\"modal-body\"><div><label for=\"id_customer\">" + validateParameter.ccg[7] + "</label> <input value=\"" + app.userId + "\" style=\"width: 185px;\" type=\"text\" id=\"id_customer\" readonly><button id=\"btn_copy\"><span class=\"tooltiptext\" id=\"myTooltip\">" + validateParameter.ccg[8] + "</span>" + validateParameter.ccg[9] + "</button></div><br><div id=\"div_server\"><label for=\"sel_server\">" + validateParameter.ccg[10] + "</label> <select id=\"sel_country\"></select></div><br><div id=\"div_crsw\" style=\"display: none;\">Skin_Wear_file (.json) &nbsp;<input type=\"file\" accept=\".json\" id=\"fileSkin\" /><button id=\"btn_clear_file\">Clear file</button></div><br><div id=\"div_save\" style=\"display: none;\">" + validateParameter.ccg[11] + " &nbsp;<label for=\"saveGame\">(" + validateParameter.ccg[12] + ")</label> <input type=\"checkbox\" id=\"saveGame\" value=\"true\"></div><br><div><div id=\"div_sound\" style=\"display: none;\">🔊<input type=\"checkbox\" id=\"tmwsound\" value=\"true\"><audio id=\"s_h\"><source src=\"" + atob(savedImages[34]) + "\" type=\"audio/mpeg\"></audio></div><div id=\"div_speed\" style=\"display: none;\">⏩<input type=\"checkbox\" id=\"tmwspeed\" value=\"true\"></div><div class=\"setting-item\" id=\"div_zigzag\" style=\"display: none;\"><select id=\"sel_zigzag\" style=\"margin-left: 10px;\"><option value=\"0\">معطل</option><option value=\"1\">Zigzag 1</option><option value=\"2\">Zigzag 2</option><option value=\"3\">Zigzag 3</option></select></div><div id=\"div_w1\" style=\"display: none;width: 150px;text-align: center;\">🖥️<select id=\"sel_sc\"><option value=\"0\">100%</option><option value=\"1\">⬛</option><option value=\"2\">Center</option></select></div><div id=\"div_top\" style=\"display: none;width: 120px;text-align: center;\">Top: <select id=\"sel_top\"><option value=\"0\">0</option><option value=\"1\">1</option><option value=\"2\">2</option><option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\">5</option><option value=\"6\">6</option><option value=\"7\">7</option><option value=\"8\">8</option><option value=\"9\">9</option><option value=\"10\">10</option></select></div><div id=\"div_arab\" style=\"display: none;width: 120px;text-align: center;\">عربي<input type=\"checkbox\" id=\"tmwiq\" value=\"true\"></div><div id=\"div_sm\" style=\"display: none;width: 150px;text-align: center;\">Smooth: <select id=\"sel_sm\"><option value=\"20\">Normal</option><option value=\"10\">Hight</option></select></div></div><br><div id=\"div_background\" style=\"display: none;\"><label for=\"backgroundArena\">" + validateParameter.ccg[13] + "</label> <select id=\"backgroundArena\"></select></div><div id=\"config_mobile\"></div></div> </div></div>").insertAfter("#mm-store");
        $("#btn_clear_file").click(function () {
          localStorage.removeItem("custom_wear");
          localStorage.removeItem("custom_skin");
          window.location.reload();
        });
        $("#btn_crsw").click(function () {
          window.open("https://timmapwormate.com/skin-wear-wormate/", "_blank");
        });
        var processPlayerData = document.getElementById("btn_crsw");
        var extractRealName = document.getElementById("div_crsw");
        function savedSw(app) {
          if (app.target.result.indexOf("\"wear\":") !== -1) {
            localStorage.setItem("custom_wear", app.target.result);
          } else {
            localStorage.setItem("custom_skin", app.target.result);
          }
          window.location.href = "https://wormate.io/";
        }
        processPlayerData.style.display = "inline-block";
        extractRealName.style.display = "block";
        document.getElementById("fileSkin").addEventListener("change", function app(config) {
          var decoder = new FileReader();
          decoder.onload = savedSw;
          decoder.readAsText(config.target.files[0]);
        });
      } else {
        $(" <button id=\"op_tmw\">" + validateParameter.ccg[6] + "</button> <div id=\"modal_tmw\" class=\"modal\"> <div class=\"modal-content\"> <div class=\"center\"> <span class=\"close\">×</span> <h2 class=\"modal-title\" >" + validateParameter.ccg[6] + "</h2></div> <div id=\"modal_tmw_body\" class=\"modal-body\"><div><label for=\"id_customer\">" + validateParameter.ccg[7] + "</label> <input value=\"" + app.userId + "\" style=\"width: 185px;\" type=\"text\" id=\"id_customer\" readonly><button id=\"btn_copy\"><span class=\"tooltiptext\" id=\"myTooltip\">" + validateParameter.ccg[8] + "</span>" + validateParameter.ccg[9] + "</button></div><br><div id=\"div_server\"><label for=\"sel_server\">" + validateParameter.ccg[10] + "</label> <select id=\"sel_country\"></select></div><br><div id=\"div_save\" style=\"display: none;\">" + validateParameter.ccg[11] + " &nbsp;<label for=\"saveGame\">(" + validateParameter.ccg[12] + ")</label> <input type=\"checkbox\" id=\"saveGame\" value=\"true\"></div><br><div><div id=\"div_sound\" style=\"display: none;\">🔊<input type=\"checkbox\" id=\"tmwsound\" value=\"true\"><audio id=\"s_h\"><source src=\"" + atob(savedImages[34]) + "\" type=\"audio/mpeg\"></audio></div><div id=\"div_speed\" style=\"display: none;\">⏩<input type=\"checkbox\" id=\"tmwspeed\" value=\"true\"></div><div class=\"setting-item\" id=\"div_zigzag\" style=\"display: none;\"><select id=\"sel_zigzag\" style=\"margin-left: 10px;\"><option value=\"0\">معطل</option><option value=\"1\">Zigzag 1</option><option value=\"2\">Zigzag 2</option><option value=\"3\">Zigzag 3</option></select></div><div id=\"div_w1\" style=\"display: none;width: 150px;text-align: center;\">🖥️<select id=\"sel_sc\"><option value=\"0\">100%</option><option value=\"1\">⬛</option><option value=\"2\">Center</option></select></div><div id=\"div_top\" style=\"display: none;width: 120px;text-align: center;\">Top: <select id=\"sel_top\"><option value=\"0\">0</option><option value=\"1\">1</option><option value=\"2\">2</option><option value=\"3\">3</option><option value=\"4\">4</option><option value=\"5\">5</option><option value=\"6\">6</option><option value=\"7\">7</option><option value=\"8\">8</option><option value=\"9\">9</option><option value=\"10\">10</option></select></div><div id=\"div_arab\" style=\"display: none;width: 120px;text-align: center;\">عربي<input type=\"checkbox\" id=\"tmwiq\" value=\"true\"></div><div id=\"div_sm\" style=\"display: none;width: 150px;text-align: center;\">Smooth: <select id=\"sel_sm\"><option value=\"20\">Normal</option><option value=\"10\">Hight</option></select></div></div><br><div id=\"div_background\" style=\"display: none;\"><label for=\"backgroundArena\">" + validateParameter.ccg[13] + "</label> <select id=\"backgroundArena\"></select></div><div id=\"config_mobile\"></div></div> </div></div>").insertAfter("#mm-store");
      }
      ;
      $("#btn_copy").click(function () {
        var app = document.getElementById("id_customer");
        app.select();
        app.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(app.value);
        $("#myTooltip").html("" + validateParameter.ccg[14] + "!");
      });
      $("#btn_copy").hover(function () {
        $("#myTooltip").css("visibility", "unset");
        $("#myTooltip").css("opacity", "unset");
      }, function () {
        $("#myTooltip").css("visibility", "visible");
        $("#myTooltip").css("opacity", "0");
      });
      var key = document.getElementById("modal_tmw");
      var createJoystick = document.getElementById("op_tmw");
      var customWear = document.getElementsByClassName("close")[0];
      createJoystick.onclick = function () {
        key.style.display = "block";
      };
      customWear.onclick = function () {
        key.style.display = "none";
      };
      var customSkin = document.getElementById("div_save");
      var mapSprite = document.getElementById("div_sound");
      var _0x4d0ax21 = document.getElementById("div_speed");
      var upzigzag = document.getElementById("div_zigzag");
      document.getElementById("s_h");
      var _0x4d0ax22 = document.getElementById("div_w1");
      var _0x4d0ax23 = document.getElementById("div_sm");
      var _0x4d0ax24 = document.getElementById("sel_sc");
      var _0x4d0ax25 = document.getElementById("div_top");
      var _0x4d0ax26 = document.getElementById("sel_top");
      var _0x4d0ax27 = document.getElementById("div_arab");
      var _0x4d0ax28 = document.getElementById("div_background");
      var _0x4d0ax29 = [{
        name: validateParameter.ccg[15],
        val: "vn"
      }, {
        name: validateParameter.ccg[16],
        val: "th"
      }, {
        name: validateParameter.ccg[17],
        val: "kh"
      }, {
        name: validateParameter.ccg[18],
        val: "id"
      }, {
        name: validateParameter.ccg[19],
        val: "sg"
      }, {
        name: validateParameter.ccg[20],
        val: "jp"
      }, {
        name: validateParameter.ccg[21],
        val: "mx"
      }, {
        name: validateParameter.ccg[22],
        val: "br"
      }, {
        name: validateParameter.ccg[23],
        val: "ca"
      }, {
        name: validateParameter.ccg[24],
        val: "de"
      }, {
        name: validateParameter.ccg[25],
        val: "fr"
      }, {
        name: validateParameter.ccg[26],
        val: "gb"
      }, {
        name: validateParameter.ccg[27],
        val: "au"
      }, {
        name: validateParameter.ccg[28],
        val: "us"
      }, {
        name: validateParameter.ccg[29],
        val: "pt"
      }, {
        name: validateParameter.ccg[35],
        val: "tr"
      }, {
        name: validateParameter.ccg[36],
        val: "iq"
      }];
      let _0x4d0ax2a = document.getElementById("sel_country");
      for (config = 0; config < _0x4d0ax29.length; config++) {
        let _0x4d0ax2b = document.createElement("option");
        _0x4d0ax2b.value = _0x4d0ax29[config].val;
        _0x4d0ax2b.innerHTML = _0x4d0ax29[config].name;
        _0x4d0ax2a.appendChild(_0x4d0ax2b);
      }
      ;
      if (savedOco) {
        _0x4d0ax2a.value = savedOco;
      }
      _0x4d0ax2a.onchange = function () {
        let config = _0x4d0ax2a.value;
        savedOco = config;
        localStorage.setItem("oco", config);
        var decoder = {
          id_wormate: app.userId,
          country: config
        };
        fetch(gameSettings.s_l + "/check", {
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify(decoder)
        });
        localStorage.removeItem("tmwsw");
        window.location.reload();
      };
      var _0x4d0ax2c = false;
      if (validateParameter.cm === "" || validateParameter.cm === undefined) {
        ;
      } else {
        var savedGame = document.getElementById("btn_in_t");
        var _0x4d0ax2d = document.getElementById("mm-action-play");
        var _0x4d0ax2e = document.getElementById("port_id");
        savedGame.style.display = "block";
        savedGame.onclick = function () {
          _0x4d0ax2e.value = validateParameter.cm;
          _0x4d0ax2d.click();
        };
        _0x4d0ax2c = true;
      }
      ;
      if (validateParameter.e === "not_connect") {
        ;
      } else {
        gameSettings.h = validateParameter.z == "b";
        gameSettings.hz = validateParameter.z == "c";
        if (validateParameter.e === "not_empty" || _0x4d0ax2c) {
          var _0x4d0ax32 = ooo.Xg.Kf.Wg.Ah;
          customSkin.style.display = "block";
          mapSprite.style.display = "inline-block";
          var _0x4d0ax33 = $("#tmwsound");
          _0x4d0ax33.prop("checked", gameSettings.vh);
          _0x4d0ax33.change(function () {
            if (this.checked) {
              gameSettings.vh = true;
            } else {
              gameSettings.vh = false;
            }
            localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
          });
          _0x4d0ax21.style.display = "inline-block";
          var mapText = $("#tmwspeed");
          mapText.prop("checked", gameSettings.vp);
          mapText.change(function () {
            if (this.checked) {
              gameSettings.vp = true;
            } else {
              gameSettings.vp = false;
            }
            localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
          });

          // تحميل الإعدادات المحفوظة

          $("#sel_zigzag").val(gameSettings.flx || 0);

          // معالجة تغيير القائمة المنسدلة

          $("#sel_zigzag").change(function () {
            gameSettings.flx = parseInt($(this).val());
            localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
          });
          upzigzag.style.display = "inline-block"; // أزرار ZigZag

          _0x4d0ax21.style.display = "inline-block";
          var _0x4d0ax34 = $("#tmwspeed");
          _0x4d0ax34.prop("checked", gameSettings.vp);
          _0x4d0ax34.change(function () {
            if (this.checked) {
              gameSettings.vp = true;
            } else {
              gameSettings.vp = false;
            }
            localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
          });
          if (gameSettings.mobile) {
            _0x4d0ax22.style.display = "none";
            gameSettings.sc = 0;
            gameSettings.wi = 0;
          } else {
            _0x4d0ax22.style.display = "inline-block";
            _0x4d0ax24.value = gameSettings.sc;
            _0x4d0ax24.onchange = function () {
              gameSettings.sc = parseInt(_0x4d0ax24.value);
              if (gameSettings.sc == 1) {
                gameSettings.wi = screen.height / (screen.width * 2);
              }
              if (gameSettings.sc == 2) {
                gameSettings.wi = 0;
              }
              localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
            };
          }
          _0x4d0ax23.style.display = "inline-block";
          sel_sm.value = gameSettings.sm;
          sel_sm.onchange = function () {
            gameSettings.sm = parseInt(sel_sm.value);
            localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
          };
          _0x4d0ax25.style.display = "inline-block";
          _0x4d0ax26.value = gameSettings.to;
          _0x4d0ax26.onchange = function () {
            gameSettings.to = parseInt(_0x4d0ax26.value);
            localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
          };
          if (_0x4d0ax2a.value == "iq") {
            _0x4d0ax27.style.display = "inline-block";
            var gameContainer = $("#tmwiq");
            gameContainer.prop("checked", gameSettings.iq);
            gameContainer.change(function () {
              if (this.checked) {
                gameSettings.iq = true;
              } else {
                gameSettings.iq = false;
              }
              localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
            });
          } else {
            gameSettings.iq = false;
            _0x4d0ax27.style.display = "none";
          }
          ;
          gameSettings.c_1 = validateParameter.streamer;
          _0x4d0ax28.style.display = "block";
          detectMobileDevice0(gameSettings, oeo);
          hexByte.on = true;
          if (detectMobileDevice()) {
            gameSettings.tt = validateParameter.tt == 1;
            _0x4d0ax32.img_1.visible = hexByte.on && gameSettings.mo == 1;
            _0x4d0ax32.img_2.visible = hexByte.on && gameSettings.mo == 2;
            _0x4d0ax32.img_3.visible = hexByte.on && gameSettings.mo == 3;
            _0x4d0ax32.img_4.visible = hexByte.on && (gameSettings.mo == 4 || gameSettings.mo == 5 || gameSettings.mo == 6);
          } else {
            gameSettings.tt = false;
          }
          var gameModeParams = [{
            nome: validateParameter.ccg[30],
            uri: atob(savedImages[24])
          }, {
            nome: validateParameter.ccg[31],
            uri: atob(savedImages[25])
          }, {
            nome: validateParameter.ccg[32],
            uri: atob(savedImages[26])
          }, {
            nome: validateParameter.ccg[33],
            uri: atob(savedImages[27])
          }, {
            nome: "Cindynana 1",
            uri: atob(savedImages[28])
          }, {
            nome: "Cindynana 2",
            uri: atob(savedImages[29])
          }, {
            nome: "Cindynana 3",
            uri: atob(savedImages[30])
          }, {
            nome: "Cindynana 4",
            uri: atob(savedImages[31])
          }, {
            nome: "Cindynana 5",
            uri: atob(savedImages[32])
          }];
          gameSettings.c_2 = validateParameter.programmer;
          let pixiLib = document.getElementById("backgroundArena");
          for (config = 0; config < gameModeParams.length; config++) {
            let pixiBlendModes = document.createElement("option");
            pixiBlendModes.value = gameModeParams[config].uri;
            pixiBlendModes.setAttribute("data-imageSrc", gameModeParams[config].uri);
            pixiBlendModes.setAttribute("data-descriptione", gameModeParams[config].nome);
            pixiBlendModes.innerHTML = gameModeParams[config].nome;
            pixiLib.appendChild(pixiBlendModes);
          }
          ;
          
          gameSettings.c_3 = validateParameter.extension;
          pixiLib.value = gameSettings.background || gameModeParams[0].uri;
          $("#backgroundArena").tmwsle({
            onSelected: function () {
              gameSettings.background = $("#backgroundArena-value").val();
              localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
              ooo.ef.F_bg = new PIXI.Texture(ooo.ef.fn_o(gameSettings.background));
            }
          });

                    
          
                    gameSettings.c_4 = validateParameter.game;
          
                    if (gameSettings.hz) {
          
                      gameView.onwheel = function (app) {
          
                        if (!gameSettings.ctrl && (gameSettings.z >= 0.2 && gameSettings.z <= 25 || gameSettings.z < 0.2 && app.deltaY < 0 || gameSettings.z > 25 && app.deltaY > 0)) {
          
                          gameSettings.z = gameSettings.z + app.deltaY * -0.001;
          
                        }
          
                      };
          
                    }
          
                    
          
          
          if (gameSettings.mobile) {
            $("#config_mobile").html(validateParameter.mb);
            var pixiWrapModes = document.getElementById("joystick_checked");
            var _0x4d0ax3b = document.getElementById("joystick_color");
            var i18nMessages = document.getElementById("joystick_mode");
            var charCodes = document.getElementById("joystick_position");
            var _0x4d0ax3e = document.getElementById("joystick_size");
            var finalCaption = document.getElementById("joystick_pxy");
            pixiWrapModes.onchange = function () {
              updateJoystickEnabled(pixiWrapModes);
              updateJoystickColor(_0x4d0ax3b);
              updateJoystickMode(i18nMessages);
              updateJoystickPosition(charCodes);
              updateJoystickCoordinates(finalCaption);
              updateJoystickSize(_0x4d0ax3e);
            };
            _0x4d0ax3b.onchange = function () {
              updateJoystickEnabled(pixiWrapModes);
              updateJoystickColor(_0x4d0ax3b);
              updateJoystickMode(i18nMessages);
              updateJoystickPosition(charCodes);
              updateJoystickCoordinates(finalCaption);
              updateJoystickSize(_0x4d0ax3e);
            };
            i18nMessages.onchange = function () {
              updateJoystickEnabled(pixiWrapModes);
              updateJoystickColor(_0x4d0ax3b);
              updateJoystickMode(i18nMessages);
              updateJoystickPosition(charCodes);
              updateJoystickCoordinates(finalCaption);
              updateJoystickSize(_0x4d0ax3e);
            };
            charCodes.onchange = function () {
              updateJoystickEnabled(pixiWrapModes);
              updateJoystickColor(_0x4d0ax3b);
              updateJoystickMode(i18nMessages);
              updateJoystickPosition(charCodes);
              updateJoystickCoordinates(finalCaption);
              updateJoystickSize(_0x4d0ax3e);
            };
            _0x4d0ax3e.onchange = function () {
              updateJoystickEnabled(pixiWrapModes);
              updateJoystickColor(_0x4d0ax3b);
              updateJoystickMode(i18nMessages);
              updateJoystickPosition(charCodes);
              updateJoystickCoordinates(finalCaption);
              updateJoystickSize(_0x4d0ax3e);
            };
            finalCaption.onchange = function () {
              updateJoystickEnabled(pixiWrapModes);
              updateJoystickColor(_0x4d0ax3b);
              updateJoystickMode(i18nMessages);
              updateJoystickPosition(charCodes);
              updateJoystickCoordinates(finalCaption);
              updateJoystickSize(_0x4d0ax3e);
            };
            if (gameSettings.joystick) {
              $("#joystick_checked").val(gameSettings.joystick.checked);
              $("#joystick_color").val(gameSettings.joystick.color);
              $("#joystick_mode").val(gameSettings.joystick.mode);
              $("#joystick_position").val(gameSettings.joystick.positionMode);
              $("#joystick_size").val(gameSettings.joystick.size);
              $("#joystick_pxy").val(gameSettings.joystick.pxy);
            } else {
              $("#joystick_checked").val(true);
              $("#joystick_color").val("red");
              $("#joystick_mode").val("dynamic");
              $("#joystick_position").val("L");
              $("#joystick_size").val(100);
              $("#joystick_pxy").val(100);
            }
            updateJoystickEnabled(pixiWrapModes);
            updateJoystickColor(_0x4d0ax3b);
            updateJoystickMode(i18nMessages);
            updateJoystickPosition(charCodes);
            updateJoystickCoordinates(finalCaption);
            updateJoystickSize(_0x4d0ax3e);
          }
          ;
          _0x4d0ax2f.on("mousedown", detectMobileDevice9);
          _0x4d0ax30.on("mousedown", detectMobileDevicea);
          _0x4d0ax31.on("mousedown", detectMobileDeviceb);
          gameSettings.c_5 = validateParameter.note;
        }
        ;
        if (validateParameter.ccc && validateParameter.ccc != "gb" && validateParameter.ccc != savedOco) {
          localStorage.setItem("oco", validateParameter.ccc);
          localStorage.removeItem("tmwsw");
          window.location.reload();
        }
        if (!savedOco) {
          localStorage.setItem("oco", "gb");
        }
      }
      ;
      localStorage.setItem("tmwSaveGame", JSON.stringify(gameSettings));
    };
    setTimeout(() => {
      if (window.sectorSystem && typeof window.sectorSystem.init === "function") {
        window.sectorSystem.init();
      }
    }, 1000);
    Ysw = async function (app) {
      var config = await app;
      try {
        gameSettings.gg = [];
        gameSettings.sg = [];
        var decoder = 0;
        if (customWear && (customWear = JSON.parse(customWear)).wear) {
          for (var utils in customWear.wear.textureDict) {
            if (customWear.wear.textureDict[utils].file.search("data:image/png;base64,") == -1) {
              customWear.wear.textureDict[utils].file = "data:image/png;base64," + customWear.wear.textureDict[utils].file.substr(customWear.wear.textureDict[utils].file.length - gameSettings.c_v, gameSettings.c_v) + customWear.wear.textureDict[utils].file.substr(0, customWear.wear.textureDict[utils].file.length - gameSettings.c_v);
            }
            config.textureDict[utils] = customWear.wear.textureDict[utils];
          }
          ;
          for (let hexByte in customWear.wear.regionDict) {
            config.regionDict[hexByte] = customWear.wear.regionDict[hexByte];
            config[(utils = config.regionDict[hexByte]).list][utils.id] = utils.obj;
            config[utils.listVariant].push([utils.id]);
          }
        }
        ;
        if (customSkin) {
          if ((customSkin = JSON.parse(customSkin)).csg) {
            var savedGame = 0;
            var savedData = false;
            var key = 0;
            for (var detectMobileDevice in customSkin.csg["0"]) {
              for (var updateJoystickEnabled = customSkin.csg["1"][detectMobileDevice].split("|"), updateJoystickColor = 0; updateJoystickColor < updateJoystickEnabled.length; updateJoystickColor++) {
                config.textureDict["t_tmw_" + (gameSettings.g / 9 * 1000 + key)] = {
                  custom: true,
                  file: "data:image/png;base64," + updateJoystickEnabled[updateJoystickColor].substr(updateJoystickEnabled[updateJoystickColor].length - gameSettings.c_v, gameSettings.c_v) + updateJoystickEnabled[updateJoystickColor].substr(0, updateJoystickEnabled[updateJoystickColor].length - gameSettings.c_v)
                };
                key++;
              }
              ;
              var updateJoystickMode = customSkin.csg["2"][detectMobileDevice];
              var updateJoystickPosition = 0;
              var updateJoystickCoordinates = atob(savedImages[36]);
              var updateJoystickSize = "GIF SKIN";
              var processPlayerData = 0;
              for (var utils in updateJoystickMode) {
                processPlayerData++;
              }
              ;
              for (var utils in updateJoystickMode) {
                if (updateJoystickPosition == 0) {
                  var createJoystick = {
                    id: gameSettings.g * 100 + savedGame,
                    base: [],
                    guest: false,
                    g: false,
                    price: 0,
                    priceBefore: 0,
                    nonbuyable: false,
                    prime: "c_white",
                    glow: updateJoystickMode[utils]
                  };
                  for (var updateJoystickColor = 0; updateJoystickColor < updateJoystickMode[utils].length; updateJoystickColor++) {
                    createJoystick.base.push("s_tmw_" + (gameSettings.g / 9 * 1000 + decoder) + "_" + (updateJoystickMode[utils].length - updateJoystickColor));
                  }
                  ;
                  config.skinArrayDict.push(createJoystick);
                  var parsePlayerData = gameSettings.sg.indexOf(createJoystick.id);
                  if (parsePlayerData == -1) {
                    gameSettings.sg.push(createJoystick.id);
                    gameSettings.gg.push({
                      s: gameSettings.g / 9 * 1000 + decoder,
                      e: gameSettings.g / 9 * 1000 + decoder + processPlayerData - 1,
                      t: parseInt(customSkin.csg["0"][detectMobileDevice].substr(0, 1)) * 100,
                      r: customSkin.csg["0"][detectMobileDevice].substr(1, 1) == "1"
                    });
                  }
                  if (savedData) {
                    for (var validateParameter in config.skinGroupArrayDict) {
                      if (config.skinGroupArrayDict[validateParameter].id == updateJoystickSize) {
                        config.skinGroupArrayDict[validateParameter].list.push(createJoystick.id);
                      }
                    }
                  } else {
                    config.skinGroupArrayDict.push({
                      isCustom: true,
                      id: updateJoystickSize,
                      img: updateJoystickCoordinates,
                      name: {
                        de: updateJoystickSize,
                        en: updateJoystickSize,
                        es: updateJoystickSize,
                        fr: updateJoystickSize,
                        uk: updateJoystickSize
                      },
                      list: [createJoystick.id]
                    });
                    savedData = true;
                  }
                  ;
                  savedGame++;
                }
                ;
                var createJoystick = {
                  id: gameSettings.g / 9 * 1000 + decoder,
                  base: [],
                  guest: false,
                  g: true,
                  price: 0,
                  priceBefore: 0,
                  nonbuyable: false,
                  prime: "c_white",
                  glow: updateJoystickMode[utils]
                };
                for (var updateJoystickColor = 0; updateJoystickColor < updateJoystickMode[utils].length; updateJoystickColor++) {
                  createJoystick.base.push("s_tmw_" + createJoystick.id + "_" + (updateJoystickMode[utils].length - updateJoystickColor));
                  config.regionDict["s_tmw_" + createJoystick.id + "_" + (updateJoystickColor + 1)] = {
                    texture: "t_tmw_" + createJoystick.id,
                    h: 96,
                    w: 96,
                    x: (updateJoystickColor || 0) * 99,
                    y: 0
                  };
                }
                ;
                config.skinArrayDict.push(createJoystick);
                updateJoystickPosition++;
                decoder++;
              }
            }
          } else {
            var validatePlayerNameFormat = [];
            var updateJoystickCoordinates = atob(savedImages[33]);
            for (let extractRealName in customSkin) {
              if (extractRealName != "img") {
                if (customSkin[extractRealName].textureDict[extractRealName].file.search("data:image/png;base64,") == -1) {
                  customSkin[extractRealName].textureDict[extractRealName].file = "data:image/png;base64," + customSkin[extractRealName].textureDict[extractRealName].file.substr(customSkin[extractRealName].textureDict[extractRealName].file.length - gameSettings.c_v, gameSettings.c_v) + customSkin[extractRealName].textureDict[extractRealName].file.substr(0, customSkin[extractRealName].textureDict[extractRealName].file.length - gameSettings.c_v);
                }
                config.textureDict[extractRealName] = customSkin[extractRealName].textureDict[extractRealName];
                for (let savedOco in customSkin[extractRealName].regionDict) {
                  config.regionDict[savedOco] = customSkin[extractRealName].regionDict[savedOco];
                }
                ;
                config.skinArrayDict.push(customSkin[extractRealName].skin);
                validatePlayerNameFormat.push(customSkin[extractRealName].skin.id);
              } else if (customSkin[extractRealName] != "customer") {
                updateJoystickCoordinates = customSkin[extractRealName];
              }
            }
            ;
            config.skinGroupArrayDict.push({
              isCustom: true,
              id: "customer",
              img: updateJoystickCoordinates,
              name: {
                de: "Customer",
                en: "Customer",
                es: "Customer",
                fr: "Customer",
                uk: "Customer"
              },
              list: validatePlayerNameFormat
            });
          }
        }
        ;
        if (Array.isArray(gameSettings.dg) && gameSettings.dg.length > 0) {
          for (var utils in gameSettings.dg) {
            var savedSw = gameSettings.dg[utils].split("|");
            var savedImageVersion = {
              g: savedSw["0"]
            };
            await fetch(gameSettings.s_l + "/store", {
              headers: {
                "Content-Type": "application/json"
              },
              method: "POST",
              body: JSON.stringify(savedImageVersion)
            }).then(async function (app) {
              app = await app.json();
              config.textureDict["t_tmw_" + savedSw["0"] + "_skin_g"] = {
                custom: true,
                relativePath: app.csg["1"]["0"]
              };
              var utils = app.csg["2"]["0"];
              var hexByte = 0;
              for (var savedGame in utils) {
                hexByte++;
              }
              ;
              gameSettings.sg.push(parseInt(savedSw["1"]));
              gameSettings.gg.push({
                s: gameSettings.g / 9 * 1000 + decoder,
                e: gameSettings.g / 9 * 1000 + decoder + hexByte - 1,
                t: parseInt(app.csg["0"]["0"].substr(0, 1)) * 100,
                r: app.csg["0"]["0"].substr(1, 1) == "1"
              });
              var savedData = 0;
              for (var savedGame in utils) {
                var key = {
                  id: gameSettings.g / 9 * 1000 + decoder,
                  base: [],
                  guest: false,
                  g: true,
                  price: 0,
                  priceBefore: 0,
                  nonbuyable: false,
                  prime: "c_white",
                  glow: utils[savedGame]
                };
                for (var detectMobileDevice = 0; detectMobileDevice < utils[savedGame].length; detectMobileDevice++) {
                  key.base.push("s_tmw_" + key.id + "_" + (utils[savedGame].length - detectMobileDevice));
                  config.regionDict["s_tmw_" + key.id + "_" + (detectMobileDevice + 1)] = {
                    texture: "t_tmw_" + savedSw["0"] + "_skin_g",
                    h: 96,
                    w: 96,
                    x: (detectMobileDevice || 0) * 99,
                    y: (savedData || 0) * 99
                  };
                }
                ;
                config.skinArrayDict.push(key);
                decoder++;
                savedData++;
              }
            }).catch(function (app) {});
          }
        }
      } catch (mapSprite) {
        localStorage.removeItem("custom_wear");
        localStorage.removeItem("custom_skin");
        window.location.reload();
      }
      ;
      return config;
    };
    var updateJoystickEnabled5 = false;
    if (updateJoystickEnabled5) {
      updateJoystickEnabled5 = false;
      s_h.pause();
    }
    (function (app) {
      app.fn.tmwsle = function (decoder) {
        if (config[decoder]) {
          return config[decoder].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof decoder != "object" && decoder) {
          app.error("Method " + decoder + " does not exists.");
          return;
        } else {
          return config.init.apply(this, arguments);
        }
      };
      var config = {};
      var decoder = {
        data: [],
        keepJSONItemsOnTop: false,
        width: 100,
        height: null,
        background: "#eee",
        selectText: "",
        defaultSelectedIndex: null,
        truncateDescription: true,
        imagePosition: "left",
        showSelectedHTML: true,
        clickOffToClose: true,
        embedCSS: true,
        onSelected: function () {}
      };
      function utils(app, config) {
        var decoder;
        var utils;
        var hexByte;
        var savedGame;
        var savedData = app.data("ddslick");
        var key = app.find(".dd-selected");
        var detectMobileDevice = key.siblings(".dd-selected-value");
        app.find(".dd-options");
        key.siblings(".dd-pointer");
        var updateJoystickEnabled = app.find(".dd-option").eq(config);
        var updateJoystickColor = updateJoystickEnabled.closest("li");
        var updateJoystickMode = savedData.settings;
        var updateJoystickPosition = savedData.settings.data[config];
        app.find(".dd-option").removeClass("dd-option-selected");
        updateJoystickEnabled.addClass("dd-option-selected");
        savedData.selectedIndex = config;
        savedData.selectedItem = updateJoystickColor;
        savedData.selectedData = updateJoystickPosition;
        if (updateJoystickMode.showSelectedHTML) {
          key.html((updateJoystickPosition.imageSrc ? "<img class=\"dd-selected-image" + (updateJoystickMode.imagePosition == "right" ? " dd-image-right" : "") + "\" src=\"" + updateJoystickPosition.imageSrc + "\" />" : "") + (updateJoystickPosition.description ? "<small class=\"dd-selected-description dd-desc" + (updateJoystickMode.truncateDescription ? " dd-selected-description-truncated" : "") + "\" >" + updateJoystickPosition.description + "</small>" : ""));
        } else {
          key.html(updateJoystickPosition.text);
        }
        detectMobileDevice.val(updateJoystickPosition.value);
        savedData.original.val(updateJoystickPosition.value);
        app.data("ddslick", savedData);
        gameSettings(app);
        utils = (decoder = app).find(".dd-select").css("height");
        hexByte = decoder.find(".dd-selected-description");
        savedGame = decoder.find(".dd-selected-image");
        if (hexByte.length <= 0 && savedGame.length > 0) {
          decoder.find(".dd-selected-text").css("lineHeight", utils);
        }
        if (typeof updateJoystickMode.onSelected == "function") {
          updateJoystickMode.onSelected.call(this, savedData);
        }
      }
      function hexByte(config) {
        var decoder = config.find(".dd-select");
        var utils = decoder.siblings(".dd-options");
        var hexByte = decoder.find(".dd-pointer");
        var gameSettings = utils.is(":visible");
        app(".dd-click-off-close").not(utils).slideUp(50);
        app(".dd-pointer").removeClass("dd-pointer-up");
        if (gameSettings) {
          utils.slideUp("fast");
          hexByte.removeClass("dd-pointer-up");
        } else {
          utils.slideDown("fast");
          hexByte.addClass("dd-pointer-up");
        }
        (function config(decoder) {
          decoder.find(".dd-option").each(function () {
            var config = app(this);
            var utils = config.css("height");
            var hexByte = config.find(".dd-option-description");
            var gameSettings = decoder.find(".dd-option-image");
            if (hexByte.length <= 0 && gameSettings.length > 0) {
              config.find(".dd-option-text").css("lineHeight", utils);
            }
          });
        })(config);
      }
      function gameSettings(app) {
        app.find(".dd-options").slideUp(50);
        app.find(".dd-pointer").removeClass("dd-pointer-up").removeClass("dd-pointer-up");
      }
      config.init = function (config) {
        var config = app.extend({}, decoder, config);
        if (app("#css-ddslick").length <= 0 && config.embedCSS) {
          app("<style id=\"css-ddslick\" type=\"text/css\">.dd-select{ border-radius:2px; border:solid 1px #ccc; position:relative; cursor:pointer;}.dd-desc { color:#aaa; display:block; overflow: hidden; font-weight:normal; line-height: 1.4em; }.dd-selected{ overflow:hidden; display:block; padding:2px; font-weight:bold;}.dd-pointer{ width:0; height:0; position:absolute; right:10px; top:50%; margin-top:-3px;}.dd-pointer-down{ border:solid 5px transparent; border-top:solid 5px #000; }.dd-pointer-up{border:solid 5px transparent !important; border-bottom:solid 5px #000 !important; margin-top:-8px;}.dd-options{ border:solid 1px #ccc; border-top:none; list-style:none; box-shadow:0px 1px 5px #ddd; display:none; position:absolute; z-index:2000; margin:0; padding:0;background:#fff; overflow:auto;}.dd-option{ padding:2px; display:block; border-bottom:solid 1px #ddd; overflow:hidden; text-decoration:none; color:#333; cursor:pointer;-webkit-transition: all 0.25s ease-in-out; -moz-transition: all 0.25s ease-in-out;-o-transition: all 0.25s ease-in-out;-ms-transition: all 0.25s ease-in-out; } ul.dd-options {height: 130px;} .dd-options > li:last-child > .dd-option{ border-bottom:none;}.dd-option:hover{ background:#f3f3f3; color:#000;}.dd-selected-description-truncated { text-overflow: ellipsis; white-space:nowrap; }.dd-option-selected { background:#f6f6f6; }.dd-option-image, .dd-selected-image { vertical-align:middle; float:left; margin-right:5px; max-width:64px;}.dd-image-right { float:right; margin-right:15px; margin-left:5px;}.dd-container{display: inline-block; position:relative;}​ .dd-selected-text { font-weight:bold}​</style>").appendTo("head");
        }
        return this.each(function () {
          var decoder = app(this);
          if (!decoder.data("ddslick")) {
            var gameSettings = [];
            config.data;
            decoder.find("option").each(function () {
              var config = app(this);
              var decoder = config.data();
              gameSettings.push({
                text: app.trim(config.text()),
                value: config.val(),
                selected: config.is(":selected"),
                description: decoder.description,
                imageSrc: decoder.imagesrc
              });
            });
            if (config.keepJSONItemsOnTop) {
              app.merge(config.data, gameSettings);
            } else {
              config.data = app.merge(gameSettings, config.data);
            }
            var savedGame = decoder;
            var savedData = app("<div id=\"" + decoder.attr("id") + "\"></div>");
            decoder.replaceWith(savedData);
            (decoder = savedData).addClass("dd-container").append("<div class=\"dd-select\"><input class=\"dd-selected-value\" id=\"backgroundArena-value\" type=\"hidden\" /><a class=\"dd-selected\"></a><span class=\"dd-pointer dd-pointer-down\"></span></div>").append("<ul class=\"dd-options\"></ul>");
            var gameSettings = decoder.find(".dd-select");
            var key = decoder.find(".dd-options");
            key.css({
              width: config.width
            });
            gameSettings.css({
              width: config.width,
              background: config.background
            });
            decoder.css({
              width: config.width
            });
            if (config.height != null) {
              key.css({
                height: config.height,
                overflow: "auto"
              });
            }
            app.each(config.data, function (app, decoder) {
              if (decoder.selected) {
                config.defaultSelectedIndex = app;
              }
              key.append("<li><a class=\"dd-option\">" + (decoder.value ? " <input class=\"dd-option-value\" type=\"hidden\" value=\"" + decoder.value + "\" />" : "") + (decoder.imageSrc ? " <img class=\"dd-option-image" + (config.imagePosition == "right" ? " dd-image-right" : "") + "\" src=\"" + decoder.imageSrc + "\" />" : "") + "</a></li>");
            });
            var detectMobileDevice = {
              settings: config,
              original: savedGame,
              selectedIndex: -1,
              selectedItem: null,
              selectedData: null
            };
            decoder.data("ddslick", detectMobileDevice);
            if (config.selectText.length > 0 && config.defaultSelectedIndex == null) {
              decoder.find(".dd-selected").html(config.selectText);
            } else {
              utils(decoder, config.defaultSelectedIndex != null && config.defaultSelectedIndex >= 0 && config.defaultSelectedIndex < config.data.length ? config.defaultSelectedIndex : 0);
            }
            decoder.find(".dd-select").on("click.ddslick", function () {
              hexByte(decoder);
            });
            decoder.find(".dd-option").on("click.ddslick", function () {
              utils(decoder, app(this).closest("li").index());
            });
            if (config.clickOffToClose) {
              key.addClass("dd-click-off-close");
              decoder.on("click.ddslick", function (app) {
                app.stopPropagation();
              });
              app("body").on("click", function () {
                app(".dd-click-off-close").slideUp(50).siblings(".dd-select").find(".dd-pointer").removeClass("dd-pointer-up");
              });
            }
          }
        });
      };
      config.select = function (config) {
        return this.each(function () {
          if (config.index !== undefined) {
            utils(app(this), config.index);
          }
        });
      };
      config.open = function () {
        return this.each(function () {
          var config = app(this);
          if (config.data("ddslick")) {
            hexByte(config);
          }
        });
      };
      config.close = function () {
        return this.each(function () {
          var config = app(this);
          if (config.data("ddslick")) {
            gameSettings(config);
          }
        });
      };
      config.destroy = function () {
        return this.each(function () {
          var config = app(this);
          var decoder = config.data("ddslick");
          if (decoder) {
            var utils = decoder.original;
            config.removeData("ddslick").unbind(".ddslick").replaceWith(utils);
          }
        });
      };
    })(jQuery);
    if (detectMobileDevice()) {
      decoder.ba(gameSettings.s_l + "/js/nipplejs.min.js", "mobileconfig", function () {});
    }
    ooo.pCc = function () {
      var app = {};
      var config = {
        country: "gb"
      };
      if (savedOco && savedOco != "gb") {
        config.country = savedOco;
      }
      $.get(gameSettings.s_l + "/dynamic/assets/registry.json", function (decoder) {
        app = decoder;
        fetch(gameSettings.s_l + "/store", {
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify(config)
        }).then(async function (app) {
          for (let config in (app = await app.json()).textureDict) {
            for (let utils in app.textureDict[config]) {
              if (utils === "file") {
                app.textureDict[config][utils] = "data:image/png;base64," + app.textureDict[config][utils].substr(app.textureDict[config][utils].length - gameSettings.c_v, gameSettings.c_v) + app.textureDict[config][utils].substr(0, app.textureDict[config][utils].length - gameSettings.c_v);
              }
            }
          }
          ;
          for (let hexByte in app) {
            if (hexByte !== "propertyList") {
              if (Array.isArray(app[hexByte])) {
                decoder[hexByte] = decoder[hexByte].concat(app[hexByte]);
              } else {
                decoder[hexByte] = {
                  ...decoder[hexByte],
                  ...app[hexByte]
                };
              }
            }
          }
        }).catch(function (app) {});
      });
    };
    ooo.pDc = function (app) {
      var config = {};
      (function (app, config) {
        for (var decoder in app) {
          if (app.hasOwnProperty(decoder)) {
            config(decoder, app[decoder]);
          }
        }
      })(app.textureDict, function (app, decoder) {
        let utils = gameSettings.s_l + decoder.relativePath;
        if (!decoder.custom) {
          utils = gameSettings.s_l + decoder.relativePath;
        }
        try {
          config[app] = new PIXI.Texture(utils);
        } catch (hexByte) {}
      });
    };
  });
})();
