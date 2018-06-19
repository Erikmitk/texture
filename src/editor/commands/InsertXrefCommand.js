import InsertInlineNodeCommand from './InsertInlineNodeCommand'
import { hasAvailableXrefTargets } from '../util/xrefHelpers'

export default class InsertXrefCommand extends InsertInlineNodeCommand {

  getType() {
    return 'xref'
  }

  createNode(tx) {
    const refType = this.config.refType
    let xref = tx.createElement('xref')
    xref.attr('ref-type', refType)
    xref.attr('rid', '')
    return xref
  }

  isDisabled(params, context) {
    const sel = params.selection
    const selectionState = params.editorSession.getSelectionState()
    const refType = this.config.refType
    const hasTargets = hasAvailableXrefTargets(refType, context)
    // We don't allow xref insertion if there are no available targets
    if (!hasTargets) {
      return true
    }
    if (!sel.isPropertySelection()) {
      return true
    }
    // We don't allow inserting an inline node on top of an existing inline
    // node.
    if (selectionState.isInlineNodeSelection()) {
      return true
    }
    return false
  }
}
