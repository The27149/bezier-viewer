import { _decorator, Component, Node, Button, Touch, EventTouch, NodeEventType, Vec2, v2, UITransform, Vec3, v3, Label } from 'cc';
import { Paper } from './Paper';
const { ccclass, property } = _decorator;

@ccclass('Point')
export class Point extends Component {

    @property(Label)
    coordinate: Label = null;

    @property(Node)
    checkTag: Node = null;

    /**触摸点的位置 */
    private touchPos: Vec2 = v2();
    private touchPos_world: Vec3 = v3();
    private touchPos_node: Vec3 = v3();

    /**保存对画布的引用 */
    private paper: Paper = null;
    /**控制点下标 */
    public index: number = 0;

    init(paper: Paper) {
        this.paper = paper;
    }

    onLoad() {
        this.addEvents();
    }

    onDestroy() {
        this.removeEvents();
    }


    private addEvents() {
        this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    }

    private removeEvents() {
        this.node.off(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(NodeEventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchMove(e: EventTouch) {
        e.propagationStopped = true;
        e.touch.getUILocation(this.touchPos);
        this.touchPos_world.x = this.touchPos.x;
        this.touchPos_world.y = this.touchPos.y;
        this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(this.touchPos_world, this.touchPos_node);
        this.node.setPosition(this.touchPos_node.x, this.touchPos_node.y);
        this.paper.updateCtrls();
    }

    private onTouchStart() {

    }

    private onTouchEnd() {
        let last = this.paper.curCtrlPoint;
        if (last) last.hideCheckTag();
        this.paper.curCtrlPoint = this;
        this.showCheckTag();
    }

    public reset(i: number, x: number, y: number) {
        this.index = i;
        this.node.setPosition(v3(x, y));
        this.coordinate.string = `P${i}(x:${x}, y:${y})`;
    }

    public showCheckTag() {
        this.checkTag.active = true;
    }

    public hideCheckTag() {
        this.checkTag.active = false;
    }
}

