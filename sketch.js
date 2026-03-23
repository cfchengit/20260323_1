// 建立指定色彩的調色盤
let palette = ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'];
let grasses = []; // 用來儲存每根水草屬性的陣列
let numGrasses = 120;
let bubbles = []; // 儲存水泡的陣列
let numBubbles = 40; // 設定水泡數量

function setup() {
  // 確保網頁沒有多餘的邊距與捲軸
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';

  // 使用全螢幕畫布
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('position', 'absolute');
  cnv.style('top', '0');
  cnv.style('left', '0');
  cnv.style('pointer-events', 'none'); // 讓畫布的滑鼠事件穿透，才能操作下方的 iframe
  cnv.style('z-index', '1');
  
  // 建立 iframe 並載入指定網頁
  let iframe = createElement('iframe');
  iframe.attribute('src', 'https://www.et.tku.edu.tw');
  iframe.style('position', 'absolute');
  iframe.style('top', '0');
  iframe.style('left', '0');
  iframe.style('width', '100vw');
  iframe.style('height', '100vh');
  iframe.style('border', 'none');
  iframe.style('z-index', '-1'); // 確保在畫布下方

  // 在 setup 時產生並儲存所有水草的屬性
  for (let i = 0; i < numGrasses; i++) {
    let c = color(random(palette));
    c.setAlpha(180); // 設定透明度 (0~255)，讓重疊的水草有半透明感

    grasses.push({
      baseX: random(width),             // 位置
      col: c,                           // 改用帶有透明度的 p5.Color 物件
      weight: random(10, 30),           // 粗細
      topY: random(height * 0.56, height * 0.75), // 水草長度為視窗高度的 1/3 到 1/4 間 (最高點落在 height * 0.66 ~ 0.75 之間)
      speed: random(0.002, 0.015),      // 搖晃頻率/速度
      noiseOffset: random(1000)         // 雜訊空間偏移
    });
  }
  
  // 在 setup 時產生初始的水泡
  for (let i = 0; i < numBubbles; i++) {
    bubbles.push(new Bubble());
  }
}

function draw() {
  clear(); // 清除上一幀的畫面，避免透明度不斷疊加
  // 設定背景顏色為 #caf0f8 (RGB: 202, 240, 248)，並加上透明度 0.2
  background('rgba(202, 240, 248, 0.2)');
  
  // 確保使用 BLEND 模式來正確顯示顏色的 alpha 透明度堆疊
  blendMode(BLEND);

  // 更新與繪製水泡（這裡放在水草後方繪製，產生層次感）
  for (let i = 0; i < bubbles.length; i++) {
    bubbles[i].update();
    bubbles[i].display();
  }

  noFill();

  for (let i = 0; i < grasses.length; i++) {
    let g = grasses[i];
    
    stroke(g.col);
    strokeWeight(g.weight);
    beginShape();
    
    // 從畫布底部往上繪製水草，每次向上移動 30 像素
    for (let y = height; y >= g.topY; y -= 45) {
      // 利用專屬 speed 與 noiseOffset 讓每根草的搖晃速度與方向都不一樣
      let n = noise(y * 0.01, frameCount * g.speed, g.noiseOffset);
      
      // 越靠近水面（y 值越小），搖晃幅度越大
      let maxSway = map(y, height, g.topY, 10, 50);
      
      // 將雜訊值 (0~1) 映射到 X 軸的偏移量 (-maxSway ~ maxSway)
      let offsetX = map(n, 0, 1, -maxSway, maxSway);
      
      let px = g.baseX + offsetX;
  
      // 如果是第一個點，重複呼叫一次作為起始控制點
      if (y === height) {
        curveVertex(px, y);
      }
      
      curveVertex(px, y);
      
      // 如果是最後一個點（下一次的 y 將小於 g.topY），重複呼叫一次作為結束控制點
      if (y - 30 < g.topY) {
        curveVertex(px, y);
      }
    }
    endShape();
  }
}

// 當視窗大小改變時，自動調整畫布尺寸
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 水泡的類別
class Bubble {
  constructor() {
    // 初始時傳入 true，讓水泡一開始就散佈在整個畫面上，而不是從最底部一起湧出
    this.reset(true); 
  }
  
  reset(initRandomY = false) {
    this.x = random(width);
    // initRandomY為真時隨機在畫面中產生，否則在視窗最底部的下方重生
    this.y = initRandomY ? random(height) : height + random(20, 100);
    this.size = random(8, 25);
    this.speed = random(1, 3);
    // 隨機決定破掉的高度：介於畫面頂端 10% 到 50% 的區域
    this.popHeight = random(height * 0.1, height * 0.5); 
    this.popped = false;
    this.popRadius = this.size;
    this.popAlpha = 255;
    this.noiseOffset = random(1000);
  }
  
  update() {
    if (!this.popped) {
      this.y -= this.speed;
      // 讓水泡左右微微搖晃
      this.x += map(noise(this.y * 0.02, this.noiseOffset), 0, 1, -1.5, 1.5);
      
      // 到達指定高度後破掉
      if (this.y < this.popHeight) {
        this.popped = true;
      }
    } else {
      // 破掉的動畫狀態更新：放大並變透明
      this.popRadius += 1.5;
      this.popAlpha -= 15;
      
      // 動畫結束後，重置水泡到底部準備重新往上升
      if (this.popAlpha <= 0) {
        this.reset();
      }
    }
  }
  
  display() {
    push();
    if (!this.popped) {
      // 繪製水泡外觀與反光
      fill(255, 100);
      stroke(255, 180);
      strokeWeight(1);
      circle(this.x, this.y, this.size);
      noStroke();
      fill(255, 200);
      circle(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.2);
    } else {
      // 繪製破掉的特效 (擴散的圓圈)
      noFill();
      stroke(255, this.popAlpha);
      strokeWeight(2);
      circle(this.x, this.y, this.popRadius);
      
      // 繪製幾個散開的小水滴
      fill(255, this.popAlpha);
      noStroke();
      for (let i = 0; i < 5; i++) {
        let angle = TWO_PI / 5 * i;
        let dropX = this.x + cos(angle) * (this.popRadius * 0.8);
        let dropY = this.y + sin(angle) * (this.popRadius * 0.8);
        circle(dropX, dropY, 3);
      }
    }
    pop();
  }
}
