(function(){

  var canvas = document.getElementById('game'),
  ctx = canvas.getContext('2d'),
  walls = [],
  borders = [],
  blocks = [],
  gameLoop,
  player, drag, moving, score, startTime,
  topScoreKey = 'topScore',
  playerReady = false,
  playerImage = new Image(),
  blockReady = false,
  blockImage = new Image(),
  block2Ready = false,
  block2Image = new Image();

  var wallW = 50,
  playerW = 40,
  playerH = 28,
  gameW = 500,
  gameH = 500;

  function initGame(){
    playerImage.onload = function () {
	    playerReady = true;
    };
    playerImage.src = "images/bird.png";

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

    blockImage.onload = function () {
	    blockReady = true;
    };
    blockImage.src = "images/pipe1.png";

    block2Image.onload = function () {
	    block2Ready = true;
    };
    block2Image.src = "images/pipe2.png";

    var fixCoord = function(ev){
      if(!ev.hasOwnProperty('offsetX')) {
        ev.offsetX = ev.layerX - ev.currentTarget.offsetLeft;
        ev.offsetY = ev.layerY - ev.currentTarget.offsetTop;
      }    
    }

    //events
    canvas.addEventListener('mousedown', function(e){
      fixCoord(e);
      if( isOver(e.offsetX, e.offsetY, player) ){
        player.offX = (e.offsetX - player.x);
        player.offY = (e.offsetY - player.y);
        drag = true;
        if(!moving) startMoving();
      }else{
        drag = false;
      }
    });

    canvas.addEventListener('mouseup', function(e){
      drag = false;
    });

    canvas.addEventListener('mousemove', function(e){
      e.preventDefault();
      fixCoord(e);
      if(drag){
        player.x = (e.offsetX - player.offX);
        player.y = (e.offsetY - player.offY);
      }

      if( isOver(e.offsetX, e.offsetY, player) || isOver(e.offsetX, e.offsetY, score) ){
        canvas.style.cursor = 'pointer';
      }else{
        canvas.style.cursor = 'default';
      }
    });

    canvas.addEventListener('click', function(e){
      fixCoord(e);
      if( isOver(e.offsetX, e.offsetY, score) ){
        resetGame();
        startGame();
      }
    });

    resetGame();
  }

  function resetGame(){
    player = {x: (gameW/2)-(playerW/2), y: (gameH/2)-(playerH/2), w: playerW, h: playerH};
    score = {x: 0, y: 0, w: 0, h: 0};
    drag = false;
    moving = false;

    blocks = [];
    blocks.push({x: wallW+21, y: wallW+10, w: 60, h: 60, o: 'v', img: blockImage});
    blocks.push({x: gameW-wallW-22-70, y: wallW+10, w: 70, h: 50, o: 'v', img: blockImage});

    blocks.push({x: wallW+10, y: gameH-wallW-17-85, w: 30, h: 85, o: 'v', img: block2Image});
    blocks.push({x: gameW-wallW-10-120, y: gameH-wallW-21-30, w: 120, h: 30, o: 'h', img: block2Image});
  }

  function isOver(x, y, shape){
    if(x >= shape.x &&
       y >= shape.y &&
       x <= (shape.x+shape.w) &&
       y <= (shape.y+shape.h)){
      return true;
    }
    return false;
  }

  function startGame(){
    gameLoop = setInterval(render, 10);
  }

  function startMoving(){
    var i = 0;
    for(;i < blocks.length;i++){
      var minV = 3, maxV = 5,
          vX = Math.floor(Math.random()*(maxV-minV+1)+minV),
          vY = Math.floor(Math.random()*(maxV-minV+1)+minV),
          d = Math.floor(Math.random() * 2);
      blocks[i].vX = vX * (d == 0 ? 1 : -1);
      blocks[i].vY = vY * (d == 0 ? 1 : -1);
    }
    moving = true;
    startTime = new Date();
  }

  function stopMoving(){
    moving = false;
    clearInterval(gameLoop);
    // Score
    drawScore();
  }

  function colCheck(shapeA, shapeB){
    // get the vectors to check against
    var vX = (shapeA.x + (shapeA.w / 2)) - (shapeB.x + (shapeB.w / 2)),
        vY = (shapeA.y + (shapeA.h / 2)) - (shapeB.y + (shapeB.h / 2)),
        // add the half widths and half heights of the objects
        hWidths = (shapeA.w / 2) + (shapeB.w / 2),
        hHeights = (shapeA.h / 2) + (shapeB.h / 2),
        colDir = null;

    // if the x and y vector are less than the half width or half height,
    // they we must be inside the object, causing a collision
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {         // figures out on which side we are colliding
      var oX = hWidths - Math.abs(vX),
          oY = hHeights - Math.abs(vY);

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

  function render(){
    ctx.clearRect (0, 0, gameW, gameH);
    ctx.fillStyle = "#000";

    var i = 0;
    for(;i < walls.length;i++){
      ctx.fillRect(walls[i].x, walls[i].y, walls[i].w, walls[i].h);
    }

    if(localStorage.getItem(topScoreKey) != null){
      ctx.fillStyle = '#FFF';
      ctx.font = "20px Helvetica";
      ctx.textAlign = "center";
	    ctx.textBaseline = "middle";
      ctx.fillText("Top score: "+localStorage.getItem(topScoreKey)+" s", gameW/2, wallW/2);
    }

    if(blockReady && block2Ready){
      for(i = 0;i < blocks.length;i++){
        if(moving){
          var j = 0;
          for(;j<borders.length;j++){
            var col = colCheck(blocks[i], borders[j]);
            if(col == 't' || col == 'b'){
              blocks[i].vY = -blocks[i].vY
            }else if(col == 'l' || col == 'r'){
              blocks[i].vX = -blocks[i].vX
            }
          }

          blocks[i].x += blocks[i].vX;
          blocks[i].y += blocks[i].vY;
        }


        if(blocks[i].o == 'v'){
          ctx.drawImage(blocks[i].img, blocks[i].x, blocks[i].y, blocks[i].w, blocks[i].h);
        }else if(blocks[i].o = 'h'){

          var x = blocks[i].x + (blocks[i].w / 2),
              y = blocks[i].y + (blocks[i].h / 2),
              angle = Math.PI/2;

          ctx.translate(x, y);
          ctx.rotate(-angle);
          ctx.drawImage(blocks[i].img, -blocks[i].h / 2, -blocks[i].w / 2, blocks[i].h, blocks[i].w);
          ctx.rotate(angle);
          ctx.translate(-x, -y);
        }
      }
    }

    if(playerReady){
      var end = false;
      for(i = 0;i < blocks.length;i++){
        var col = colCheck(player, blocks[i]);
        if(col != null){
          end = true;
        }
      }
      for(i = 0;i < walls.length;i++){
        var col = colCheck(player, walls[i]);
        if(col != null){
          end = true;
        }
      }

      ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
      if(end){
        stopMoving();
      }
    }
  }

  function drawScore(){
    var sW = 200, sH = 100,
    points = (new Date() - startTime)/1000;
    score = {w: sW, h: sH, x: (gameW/2)-(sW/2), y: (gameH/2)-(sH/2)};
    ctx.fillStyle = "#000";
    ctx.fillRect(score.x, score.y, score.w, score.h);
    ctx.fillStyle = 'green';
    ctx.font = "40px Helvetica";
    ctx.textAlign = "center";
	  ctx.textBaseline = "middle";
    ctx.fillText(""+points+" s", score.x+(score.w/2), score.y+(score.h/2));
    //top score
    var currTopScore = localStorage.getItem(topScoreKey);
    if(points > currTopScore){
      localStorage.setItem(topScoreKey, points);
    }
  }

  initGame();
  startGame();

})()
