require([], function () { 
  Q.Sprite.extend('Player', {
    init: function (p) {
      this._super(p, {
        sheet: 'player',
        tagged: false,
        invincible: false,
        speed: 200
      });
      this.add('2d, platformerControls, animation');
      this.on('hit', function (collision) {
        if (this.p.tagged && collision.obj.isA('Actor') && !collision.obj.p.tagged && !collision.obj.p.invincible) {
          this.p.socket.emit('tag', { playerId: collision.obj.p.playerId });
          this.p.tagged = false;
          this.p.sheet = 'player';
          this.p.invincible = true;
          this.p.opacity = 0.5;
          var temp = this;
          setTimeout(function () {
            temp.p.invincible = false;
            temp.p.opacity = 1;
          }, 3000);
        }
      });
      this.on('join', function () {
        this.p.invincible = true;
        this.p.opacity = 0.5;
        var temp = this;
        setTimeout(function () {
          temp.p.invincible = false;
          temp.p.opacity = 1;
        }, 3000);
      });
    },
    updateInterval:2000,
    lastTimeSynced:0,
    step: function (dt) {
      if (Q.inputs['up']) {
        this.p.vy = -this.p.speed;
      } else if (Q.inputs['down']) {
        this.p.vy = this.p.speed;
      } else if (!Q.inputs['down'] && !Q.inputs['up']) {
        this.p.vy = 0;
      }

      if(Q.inputs['right'] || Q.inputs['left'] || Q.inputs['up'] || Q.inputs['down'] || (Date.now() - this.lastTimeSynced) > this.updateInterval ) {
        this.p.socket.emit('update', {
          name: this.p.name,
          playerId: this.p.playerId,
          x: this.p.x,
          y: this.p.y,
          sheet: this.p.sheet
        });
        this.lastTimeSynced = Date.now();
      }

      this.p.textAbove.p.label = this.p.name;
      this.p.textAbove.p.x = this.p.x;
      this.p.textAbove.p.y = this.p.y + 20;
    }
  });

  Q.Sprite.extend('Actor', {
    init: function (p) {
      this._super(p, {
        update: true,
        speed:300,
        targetX:null,
        targetY:null
      });
   
      var temp = this;
      setInterval(function () {
        if (!temp.p.update) {
          temp.destroy();
        }
        temp.p.update = false;
      }, 3000);
    },
    step:function(dt) {
      var moveOn = this.p.speed * dt;

      if(this.p.targetX != null) {
        (this.p.targetX) > this.p.x && (this.p.x += moveOn); // move right
        (this.p.targetX) < this.p.x && (this.p.x -= moveOn); // move left
        if (Math.abs(this.p.targetX - this.p.x) <= moveOn) {// stop shaking
          this.p.x = this.p.targetX
          this.p.targetX = null
        }
      }

      if(this.p.targetY != null) {
        (this.p.targetY > this.p.y) && (this.p.y += moveOn);
        (this.p.targetY < this.p.y) && (this.p.y -= moveOn);
        if (Math.abs(this.p.targetY - this.p.y) <= moveOn) { // stop shaking
          this.p.y = this.p.targetY;
          this.p.targetY = null;
        }
      }

      this.p.textAbove.p.label = this.p.name;
      this.p.textAbove.p.x = this.p.x;
      this.p.textAbove.p.y = this.p.y + 20;
    }
  });
  
});