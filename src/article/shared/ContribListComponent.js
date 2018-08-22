import { FontAwesomeIcon, uniq, without, uuid } from 'substance'
import { ModalDialog, NodeComponent } from '../../kit'
import renderEntity from '../shared/renderEntity'
import updateEntityChildArray from '../shared/updateEntityChildArray'
import AffiliationsListComponent from './AffiliationsListComponent'

export default class ContribsListComponent extends NodeComponent {
  didMount () {
    super.didMount()
    this.handleActions({
      'done': this._doneEditing,
      'cancel': this._doneEditing,
      'closeModal': this._doneEditing,
      'entitiesSelected': this._updateContribs
    })
  }

  getInitialState () {
    let entityIds = this._getEntityIds()
    return {
      hidden: entityIds.length === 0,
      edit: false
    }
  }

  _getEntityIds () {
    return this.props.node.findAll('contrib').map(contrib => contrib.getAttribute('rid'))
  }

  render ($$) {
    const api = this.context.api
    const article = api.getArticle()
    const entityIds = this._getEntityIds()
    let el = $$('div').addClass(this.getClassNames())

    if (this.state.hidden) {
      el.addClass('sm-hidden')
      return el
    }

    if (this.state.edit) {
      var modal = $$(ModalDialog, {
        width: 'medium',
        textAlign: 'center'
      })
      // modal.append(
      //   $$(EditRelationship, {
      //     propertyName: this.getPropertyName(),
      //     entityIds: this._getEntityIds(),
      //     targetTypes: this.getTargetTypes()
      //   })
      // )
      el.append(modal)
    }

    let contentEl = $$('div').addClass('se-content')
    if (entityIds.length > 0) {
      entityIds.forEach((entityId, index) => {
        let entity = article.get(entityId)
        if (!entity) {
          console.error('FIXME: no entity for contrib', entityId)
        } else {
          let short = entity.type === 'organisation'
          contentEl.append(
            $$('span').addClass('se-contrib').html(
              renderEntity(entity, { short })
            )
          )
          if (index < entityIds.length - 1) {
            contentEl.append(', ')
          }
        }
      })
    } else {
      contentEl.append(
        $$('span').addClass('se-contrib sm-empty').append('No Authors')
      )
    }

    contentEl.append(
      ' ',
      $$('button').append(
        $$(FontAwesomeIcon, { icon: 'fa-pencil' })
      ).on('click', this._editContribs)
    )

    el.append(contentEl)

    el.append(
      $$(AffiliationsListComponent, {
        node: this.props.node
      })
    )
    return el
  }

  _editContribs () {
    this.setState({
      edit: true
    })
  }

  _doneEditing () {
    this.setState({
      edit: false
    })
  }

  _updateContribs (entityIds) {
    let oldEntityIds = this._getEntityIds()
    let editorSession = this.context.editorSession

    editorSession.transaction(tx => {
      updateEntityChildArray(tx, this.props.node.id, 'contrib', 'rid', oldEntityIds, entityIds)
      this._updateAffs(tx, entityIds)
    })

    this.setState({
      edit: false
    })
  }

  /*
    Creates new aff entries and removes old ones
  */
  _updateAffs (tx, contribIds) {
    const api = this.context.api
    const article = api.getArticle()
    let editorSession = this.context.editorSession
    let doc = editorSession.getDocument()
    let oldOrgIds = doc.findAll('aff-group > aff').map(a => a.attr('rid'))
    let newOrgIds = []
    contribIds.forEach(contribId => {
      let entity = article.get(contribId)
      newOrgIds = newOrgIds.concat(entity.affiliations)
    })
    newOrgIds = uniq(newOrgIds)

    let addedOrgIds = without(newOrgIds, ...oldOrgIds)
    let removedOrgIds = without(oldOrgIds, ...newOrgIds)
    let affGroupEl = tx.find('aff-group')

    // Remove no longer used aff records (mappings)
    removedOrgIds.forEach(entityId => {
      let affNode = affGroupEl.find(`aff[rid=${entityId}]`)
      affGroupEl.removeChild(affNode)
      // Remove it completely
      tx.delete(affNode.id)
    })

    // Create aff records (mappings)
    addedOrgIds.forEach(entityId => {
      let affNode = affGroupEl.find(`aff[rid=${entityId}]`)
      if (!affNode) {
        affNode = tx.createElement('aff', {id: uuid('aff')})
        affNode.attr('rid', entityId)
      }
      affGroupEl.appendChild(affNode)
    })
  }
}
