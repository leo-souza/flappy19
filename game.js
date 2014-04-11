//Game19s : github.com/leo-souza

var util = {
  each: function(array, block){
    var i = 0;
    for(; i < array.length; i++){
      block.call(array[i], i);
    }    
  },
  isOver: function(mouseEvent, shape){
    if(!mouseEvent.hasOwnProperty('offsetX')){
      mouseEvent.offsetX = mouseEvent.layerX - mouseEvent.currentTarget.offsetLeft;
      mouseEvent.offsetY = mouseEvent.layerY - mouseEvent.currentTarget.offsetTop;
    }  
    if(!shape.hidden &&
       mouseEvent.offsetX >= shape.x &&
       mouseEvent.offsetY >= shape.y &&
       mouseEvent.offsetX <= (shape.x+shape.w) &&
       mouseEvent.offsetY <= (shape.y+shape.h)){
      return true;
    }
    return false;
  },
  colCheck: function(shapeA, shapeB){
    // get the vectors to check against
    var vX = (shapeA.x + (shapeA.w / 2)) - (shapeB.x + (shapeB.w / 2)),
        vY = (shapeA.y + (shapeA.h / 2)) - (shapeB.y + (shapeB.h / 2)),
        // add the half widths and half heights of the objects
        hWidths = (shapeA.w / 2) + (shapeB.w / 2),
        hHeights = (shapeA.h / 2) + (shapeB.h / 2),
        colDir = null;

    // if the x and y vector are less than the half width or half height,
    // they we must be inside the object, causing a collision
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {         
      var oX = hWidths - Math.abs(vX),
          oY = hHeights - Math.abs(vY);
      // figures out on which side we are colliding
      if (oX >= oY) {
        if (vY > 0) {
          colDir = "t";
          shapeA.y += oY;
        } else {
          colDir = "b";
          shapeA.y -= oY;
        }
      } else {
        if (vX > 0) {
          colDir = "l";
          shapeA.x += oX;
        } else {
          colDir = "r";
          shapeA.x -= oX;
        }
      }
    }
    return colDir;
  }
};

var Game19s = function(config) {

  if(!config)        config = {};
  if(!config.wall)   config.wall = {};
  if(!config.canvas) config.canvas = {};
  if(!config.player) config.player = {};
  if(!config.blocks) config.blocks = [];

  var options = config, 
      canvas = document.getElementById(options.canvas.id || 'canvas'),
      ctx = canvas.getContext('2d'),
      walls = [],
      borders = [],
      blocks = [],
      loadQueue = {},
      gameLoop,
      player,
      gameState,
      scorePopup,
      startTime,
      points,
      states = {initial: 0, playing: 1, ended: 2},
      wallW = options.wall.width || 50,
      gameW = options.canvas.width || 500,
      gameH = options.canvas.height || 500,
      version = '1.0';

  //private functions
  var reset = function(){
    player.x = (gameW/2)-(player.w/2);
    player.y = (gameH/2)-(player.h/2);
    player.dragging = false;
    scorePopup.hidden = true;
 
    util.each(blocks, function(){
      this.x = this.initial.x;
      this.y = this.initial.y;        
    });
    gameState = states.initial;
    render();
  },

  start = function(){
    util.each(blocks, function(){
      var minV = 3, maxV = 5,
          vX = Math.floor(Math.random()*(maxV-minV+1)+minV),
          vY = Math.floor(Math.random()*(maxV-minV+1)+minV),
          d = Math.floor(Math.random() * 2);
      this.vX = vX * (d == 0 ? 1 : -1);
      this.vY = vY * (d == 0 ? 1 : -1);
    });
    startTime = +new Date();
    gameState = states.playing;
    gameLoop = setInterval(render, 10);
  },

  stop = function(){
    points = (+new Date() - startTime)/1000;
    //top score
    var database = JSON.parse(localStorage.getItem(version));
    if(points > database.top_score){
      database.top_score = points;
    }
    database.deaths += 1;
    localStorage.setItem(version, JSON.stringify(database));
    clearInterval(gameLoop);
    scorePopup.hidden = false;
    gameState = states.ended;
  },

  initPlayer = function(){
    player = {w: options.player.width, h: options.player.height};
    player.img = new Image();    
    player.img.onload = function () {
      loadQueue['player_img'] = true;
    };
    loadQueue['player_img'] = false;
    player.img.src = options.player.img;
  },

  initBlocks = function(){
    util.each(options.blocks, function(i){
      var newblock = {w: this.width, h: this.height, o: this.orientation, img: new Image()};
      newblock.img.onload = function(){
        loadQueue['block_img'+i] = true;
      };
      loadQueue['block_img'+i] = false;
      newblock.img.src = this.img;
      blocks.push(newblock);
    });

    blocks[0].initial = {x: (wallW + 21),                       y: (wallW + 10)};
    blocks[1].initial = {x: (gameW - wallW - 22 - blocks[1].w), y: (wallW + 10)};
    blocks[2].initial = {x: (wallW + 10),                       y: (gameH - wallW - 17 - blocks[2].h)};
    blocks[3].initial = {x: (gameW - wallW - 10 - blocks[3].w), y: (gameH - wallW - 21 - blocks[3].h)};
  },

  initStage = function(){
    canvas.width = gameW;
    canvas.height = gameH;

    walls.push({x: 0, y: 0, w: gameW, h: wallW});
    walls.push({x: 0, y: gameH-wallW, w: gameW, h: wallW});
    walls.push({x: 0, y: 0, w: wallW, h: gameH});
    walls.push({x: gameW-wallW, y: 0, w: wallW, h: gameH});

    borders.push({x: 0, y: 0, w: gameW, h: 2});
    borders.push({x: 0, y: gameH-2, w: gameW, h: 2});
    borders.push({x: 0, y: 0, w: 2, h: gameH});
    borders.push({x: gameW-2, y: 0, w: 2, h: gameH});

    var sW = 200, sH = 100;

    scorePopup = {w: sW, h: sH, x: (gameW/2)-(sW/2), y: (gameH/2)-(sH/2)};

    for (var key in localStorage) {
      if(key != version) localStorage.removeItem(key);
    }
    if(localStorage.getItem(version) == null){
      localStorage.setItem(version, JSON.stringify({deaths: 0, top_score: 0}));
    }
  },

  isLoading = function(){
    for (var key in loadQueue) {
      if(loadQueue[key] == false) return true;
    }
    return false;
  },

  events = {
  
    mousedown: function(ev){
      player.dragging = false;
      if( gameState == states.initial && util.isOver(ev, player) ){
        player.offX = (ev.offsetX - player.x);
        player.offY = (ev.offsetY - player.y);
        player.dragging = true;
        start();  
      }
    },

    mouseup: function(ev){
      player.dragging = false;
    },

    mousemove: function(ev){
      ev.preventDefault();
      if( util.isOver(ev, player) || util.isOver(ev, scorePopup) ){
        canvas.style.cursor = 'pointer';
      }else{
        canvas.style.cursor = 'default';
      }
      if(player.dragging){
        player.x = (ev.offsetX - player.offX);
        player.y = (ev.offsetY - player.offY);
      }
    },

    click: function(ev){
      if( util.isOver(ev, scorePopup) ){
        reset();
      }
    }
  },

  render = function(){
    ctx.clearRect (0, 0, gameW, gameH);
    ctx.fillStyle = "#000";

    util.each(walls, function(){
      ctx.fillRect(this.x, this.y, this.w, this.h);
    });
  
    var database = JSON.parse(localStorage.getItem(version));
    ctx.fillStyle = '#FFF';
    ctx.font = "20px Helvetica";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(database.deaths, wallW, wallW/2);
    ctx.textAlign = "right";
    ctx.fillText("Top score: "+database.top_score+" s", gameW - wallW, wallW/2); 
    
    util.each(blocks, function(){
      var block = this;
      if(gameState == states.playing){
        util.each(borders, function(){
          var col = util.colCheck(block, this);
          if(col == 't' || col == 'b'){
            block.vY = -block.vY
          }else if(col == 'l' || col == 'r'){
            block.vX = -block.vX
          }
        });
        
        block.x += block.vX;
        block.y += block.vY;
      }
      if(block.o == 'v'){
        ctx.drawImage(block.img, block.x, block.y, block.w, block.h);
      }else if(block.o = 'h'){

        var x = block.x + (block.w / 2),
            y = block.y + (block.h / 2),
            angle = Math.PI/2;

        ctx.translate(x, y);
        ctx.rotate(-angle);
        ctx.drawImage(block.img, -block.h / 2, -block.w / 2, block.h, block.w);
        ctx.rotate(angle);
        ctx.translate(-x, -y);
      }
    });

    var end = false;
    util.each(blocks, function(){
      var col = util.colCheck(player, this);
      if(col != null){
        end = true;
      }
    });
    util.each(walls, function(){
      var col = util.colCheck(player, this);
      if(col != null){
        end = true;
      }
    });
  
    ctx.drawImage(player.img, player.x, player.y, player.w, player.h);
    if(end) stop();
    
    if(!scorePopup.hidden){
      ctx.fillStyle = "#000";
      ctx.fillRect(scorePopup.x, scorePopup.y, scorePopup.w, scorePopup.h);
      ctx.fillStyle = 'green';
      ctx.font = "40px Helvetica";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(""+points+" s", scorePopup.x+(scorePopup.w/2), scorePopup.y+(scorePopup.h/2));
    }
  };

  //init code
  canvas.addEventListener('mousedown', events.mousedown);
  canvas.addEventListener('mouseup', events.mouseup);
  canvas.addEventListener('mousemove', events.mousemove);
  canvas.addEventListener('click', events.click); 
  initPlayer();
  initStage(); 
  initBlocks(); 

  //public functions
  this.init = function(){
    if(isLoading()){
      setTimeout(arguments.callee, 200);    
    }else{
      reset();
    }
  };

  if (window.addEventListener){
    var index = 0;
    var konami = [38,38,40,40,37,39,37,39,66,65];//,13];

    window.addEventListener("keydown", function(e){

      if (e.keyCode === konami[index]){
        index++; //valid key at the valid point
        if (index == konami.length){

          var block = new Image();
          block.onload = function(){
            util.each(blocks, function(){
              this.img = block;
              this.w = '60';
              this.h = '60';
              this.o = 'v';
            });
            reset();
          };
          block.src = 'images/2048.png';
          
        }else{
          //
        }
      }else{
        // incorrect code restart
        index = 0; 
      }
    });
  }
};

  
(function(){
  ////
  var flappy19s = new Game19s({
    canvas: {
      id: 'game'    
    },
    player: {
      img: 'images/bird.png',
      width: 40,
      height: 28,
    },
    blocks: [
      {width: 60, height: 60, orientation: 'v', img: 'images/pipe1.png'},
      {width: 70, height: 50, orientation: 'v', img: 'images/pipe1.png'},
      {width: 30, height: 85, orientation: 'v', img: 'images/pipe2.png'},
      {width: 120, height: 30, orientation: 'h', img: 'images/pipe2.png'}    
    ]
  });

  flappy19s.init();

})();
