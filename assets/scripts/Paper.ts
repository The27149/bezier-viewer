import { _decorator, Component, Node, Prefab, Vec2, Sprite, Color, ColorKey, color, UITransform, Vec3, v3, v2, CCFloat } from 'cc';
import NodeFactory from './NodeFactory';
const { ccclass, property } = _decorator;

@ccclass('Paper')
export class Paper extends Component {

    @property(Prefab)
    pointPre: Prefab = null;

    @property(Color)
    lineColor: Color = null;

    @property(CCFloat)
    lineWidth: number = 5;

    @property(Node)
    lineContainer: Node = null;

    @property(Node)
    ctrlContainer: Node = null;


    private pointPool: NodeFactory = null;
    private pointNum: number = 1000;

    onLoad() {
        this.pointPool = new NodeFactory(this.pointPre);
        this.pointPool.init(this.pointNum);
        this.randomDraw(2);
    }

    private randomDraw(stage: number = 3) {
        let arr: Vec2[] = [];
        for (let i = 0; i < stage + 1; i++) {
            arr.push(v2(this.random(-960, 960), this.random(-540, 540)));
        }
        this.draw(arr);
    }

    private random(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    private draw(ctrls: Vec2[]) {
        this.clearPaper();
        let n = ctrls.length - 1;
        //绘制控制点
        for (let k = 0; k < n + 1; k++) {
            let point = this.pointPool.getNode();
            point.parent = this.ctrlContainer;
            let ui = point.getComponent(UITransform);
            ui.width = ui.height = this.lineWidth * 3;
            point.getComponent(Sprite).color = Color.YELLOW;
            point.setPosition(v3(ctrls[k].x, ctrls[k].y));
        }
        //绘制生成的线
        for (let i = 0, len = this.pointNum; i < len; i++) {
            let node = this.lineContainer.children[i];
            if (!node) {
                node = this.pointPool.getNode();
                node.parent = this.lineContainer;
            }
            node.getComponent(Sprite).color = this.lineColor;
            let ui = node.getComponent(UITransform);
            ui.width = ui.height = this.lineWidth;
            let t = i / len, x = 0, y = 0;
            let item: number, ctrl: Vec2;
            for (let j = 0; j < n + 1; j++) {
                item = this.comb(n, j) * Math.pow(1 - t, n - j) * Math.pow(t, j);
                ctrl = ctrls[j];
                x += ctrl.x * item;
                y += ctrl.y * item;
            }
            node.setPosition(v3(x, y));
        }
    }

    /**清理画布 */
    private clearPaper() {
        this.lineContainer.children.forEach(child => { this.pointPool.putNode(child) });
        this.ctrlContainer.children.forEach(child => { this.pointPool.putNode(child) });
    }

    /**计算阶乘 */
    private stageMultiList: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
    private stageMulti(num: number): number {
        let res = this.stageMultiList[num];
        if (!res) {
            res = num * this.stageMulti(num - 1);
            this.stageMultiList[num] = res;
        }
        return res;
    }

    /** 计算组合数 */
    private comb(n: number, i: number): number {
        return this.stageMulti(n) / this.stageMulti(i) / this.stageMulti(n - i);
    }
}

