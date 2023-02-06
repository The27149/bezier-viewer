import { instantiate, Node, NodePool, Prefab, _decorator } from "cc";


const { ccclass, property } = _decorator;

@ccclass
export default class NodeFactory {

    constructor(pre: Prefab) {
        this.prefab = pre;
    }

    private prefab: Prefab = null;
    private nodePool: NodePool = new NodePool();

    public init(num: number) {
        for (let i = 0; i < num; i++) {
            this.nodePool.put(instantiate(this.prefab));
        }
    }

    /** 获取节点 */
    public getNode(): Node {
        let node: Node = null;
        if (this.nodePool.size() > 0) {
            node = this.nodePool.get();
        } else {
            node = instantiate(this.prefab);
        }
        return node;
    }

    /** 放回节点 */
    public putNode(node: Node) {
        let test: Node = this.getNode();
        if (node.name === test.name) this.nodePool.put(node);
        else console.warn(`节点放回到错误的节点池：`, node, this.nodePool);
    }

    /**清空节点池 */
    public clear() {
        this.nodePool && this.nodePool.clear();
    }
}
