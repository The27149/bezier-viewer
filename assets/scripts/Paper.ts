import { _decorator, Component, Node, Prefab, Vec2, Sprite, Color, ColorKey, color, UITransform, Vec3, v3, v2, CCFloat, Graphics, Label, find, director, Canvas, NodeEventType, EventTouch, EventMouse, Button } from 'cc';
import NodeFactory from './NodeFactory';
import { Point } from './Point';
const { ccclass, property } = _decorator;

@ccclass('Paper')
export class Paper extends Component {

    @property(Prefab)
    pointPre: Prefab = null;

    @property(Color)
    lineColor: Color = null;

    @property(CCFloat)
    lineWidth: number = 5;

    @property(CCFloat)
    sampleNum: number = 1000;

    @property(Node)
    lineContainer: Node = null;

    @property(Node)
    ctrlContainer: Node = null;

    @property(Node)
    graphicsContainer: Node = null;

    @property(Label)
    paperScale: Label = null;

    @property(Button)
    addCtrlPoint: Button = null;

    @property(Button)
    removeCtrlPoint: Button = null;

    @property(Button)
    standardBtn: Button = null;

    @property(Button)
    helpBtn: Button = null;

    @property(Node)
    helpContent: Node = null;

    private canvasNode: Node = null;
    private pointPool: NodeFactory = null;
    /**所有控制点坐标 */
    private ctrlPoints: Vec2[] = [];

    /**当前选中的控制点 */
    public curCtrlPoint: Point = null;
    private curLineWidth: number = 1;

    onLoad() {
        this.canvasNode = director.getScene().getComponentInChildren(Canvas).node;
        this.addEvents();
        this.curLineWidth = this.lineWidth;
        this.pointPool = new NodeFactory(this.pointPre);
        this.pointPool.init(this.sampleNum);
        this.randomDraw(3);
    }

    onDestroy() {
        this.removeEvents();
    }

    private addEvents() {
        this.canvasNode.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
        this.canvasNode.on(NodeEventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.addCtrlPoint.node.on(Button.EventType.CLICK, this.onAddCtrl, this);
        this.removeCtrlPoint.node.on(Button.EventType.CLICK, this.onRemoveCtrl, this);
        this.standardBtn.node.on(Button.EventType.CLICK, this.onStandard, this);
        this.helpBtn.node.on(Button.EventType.CLICK, this.onClickHelp, this);
    }

    private removeEvents() {
        this.canvasNode.off(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
        this.canvasNode.off(NodeEventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.addCtrlPoint.node.off(Button.EventType.CLICK, this.onAddCtrl, this);
        this.removeCtrlPoint.node.off(Button.EventType.CLICK, this.onRemoveCtrl, this);
        this.standardBtn.node.off(Button.EventType.CLICK, this.onStandard, this);
        this.helpBtn.node.off(Button.EventType.CLICK, this.onClickHelp, this);
    }

    private onTouchMove(e: EventTouch) {
        let delta = e.touch.getDelta();
        this.node.position = this.node.position.add3f(delta.x, delta.y, 0);
    }

    private onMouseWheel(e: EventMouse) {
        // console.log('滚动：', e, e.getScrollX(), e.getScrollY());
        let long = e.getScrollY();
        //向上滚 放大
        let v_old = this.node.scale.x;
        let v = long > 0 ? v_old * 1.1 : v_old * 0.9;
        this.paperScale.string = v.toString();
        this.node.setScale(v, v);
        this.curLineWidth = this.lineWidth * (1 / this.node.scale.x);
        this.draw();
    }

    private randomDraw(stage: number = 3) {
        for (let i = 0; i < stage + 1; i++) {
            let x = Math.round(this.random(-960, 960));
            let y = Math.round(this.random(-540, 540));
            this.ctrlPoints.push(v2(x, y));
        }
        this.draw();
    }

    private random(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**控制点更新后 重绘曲线 */
    public updateCtrls() {
        this.ctrlPoints.length = this.ctrlContainer.children.length;
        for (let i = 0; i < this.ctrlPoints.length; i++) {
            let child = this.ctrlContainer.children[i];
            let point = this.ctrlPoints[i];
            if (!point) point = v2();
            point.x = child.position.x;
            point.y = child.position.y;
            this.ctrlPoints[i] = point;
        }
        this.draw();
    }

    public draw() {
        this.drawCtrls();
        let points = this.ctrlPoints;
        //计算路径坐标
        let n = points.length - 1;
        for (let i = 0, len = this.sampleNum; i < len; i++) {
            let t = i / len, x = 0, y = 0;
            let item: number, ctrl: Vec2;
            for (let j = 0; j < n + 1; j++) {
                item = this.comb(n, j) * Math.pow(1 - t, n - j) * Math.pow(t, j);
                ctrl = points[j];
                x += ctrl.x * item;
                y += ctrl.y * item;
            }
            // this.line1(x, y, i);
            this.drawLines(x, y, i);
        }
    }


    // /**方式1： 点累积成线 */
    // private line1(x: number, y: number, i: number) {
    //     this.lineContainer.children.forEach(child => { this.pointPool.putNode(child) });
    //     let node = this.lineContainer.children[i];
    //     if (!node) {
    //         node = this.pointPool.getNode();
    //         node.parent = this.lineContainer;
    //     }
    //     node.getComponent(Sprite).color = this.lineColor;
    //     let ui = node.getComponent(UITransform);
    //     ui.width = ui.height = this.lineWidth;
    //     node.setPosition(v3(x, y));
    // }

    /**绘制控制点*/
    private drawCtrls() {
        let children = this.ctrlContainer.children;
        let points = this.ctrlPoints;
        //如果有多余的点 先回收
        while (children.length > points.length) {
            let last = children[children.length - 1];
            this.pointPool.putNode(last);
        }
        for (let i = 0; i < points.length; i++) {
            let child = children[i];
            if (!child) {
                child = this.pointPool.getNode();
                child.parent = this.ctrlContainer;
                child.setSiblingIndex(i);
                let ui = child.getComponent(UITransform);
                ui.width = ui.height = this.curLineWidth * 5;
                child.getComponent(Sprite).color = Color.YELLOW;
                child.getComponent(Point).init(this);
            }
            let x = points[i].x, y = points[i].y;
            child.getComponent(Point).reset(i, x, y);
        }
    }

    /**方式2： canvas2d绘制 */
    private drawLines(x: number, y: number, i: number) {
        let g = this.graphicsContainer.getComponent(Graphics);
        g.lineWidth = this.curLineWidth;
        if (i === 0) {
            g.clear();
            g.moveTo(x, y);
        } else g.lineTo(x, y);
        if (i === this.sampleNum - 1) g.stroke();
    }

    // private ctrls2() {
    //     let g = this.graphicsContainer.getComponent(Graphics);
    //     let ctrls = this.ctrlPoints;
    //     for (let k = 0; k < ctrls.length; k++) {
    //         g.circle(ctrls[k].x, ctrls[k].y, this.lineWidth * 1.5);
    //         g.fillColor = Color.YELLOW;
    //         g.fill();

    //     }
    // }

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


    /**增加控制点 */
    private onAddCtrl() {
        if (!this.curCtrlPoint) return;
        let idx = this.curCtrlPoint.index;
        let temp = this.ctrlPoints.splice(idx + 1);
        this.ctrlPoints.push(v2());
        this.ctrlPoints.push(...temp);
        this.draw();
    }

    /**减少控制点 */
    private onRemoveCtrl() {
        if (!this.curCtrlPoint) return;
        if (this.ctrlPoints.length < 2) return;
        let idx = this.curCtrlPoint.index;
        this.ctrlPoints.splice(idx, 1);
        this.draw();
    }

    /**标准化曲线 起点设置在（0, 0） */
    private onStandard() {
        let first: Vec2 = this.ctrlPoints[0].clone();
        if (!first) return;
        for (let item of this.ctrlPoints) {
            item.subtract(first);
        }
        this.draw();
    }

    private onClickHelp() {
        this.helpContent.active = !this.helpContent.active;
    }
}

