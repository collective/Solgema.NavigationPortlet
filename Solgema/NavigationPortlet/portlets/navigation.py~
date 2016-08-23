import logging
from Acquisition import aq_inner, aq_base, aq_parent
from zope.interface import implements, Interface
from zope.component import adapts, getMultiAdapter, queryUtility, getUtility
from zope import schema
from zope.formlib import form
from zope.publisher.browser import BrowserPage

from plone.i18n.normalizer.interfaces import IIDNormalizer
from Products.CMFPlone.utils import getFSVersionTuple

from types import StringType

from plone.memoize import instance
from plone.memoize import view
from plone.memoize.compress import xhtml_compress
from plone.memoize.instance import memoize
from plone.app.uuid.utils import uuidToObject

from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from Products.CMFCore.utils import getToolByName
from Products.CMFPlone import utils
from Products.ATContentTypes.interface import IATFolder

from Products.CMFPlone.interfaces import INonStructuralFolder
try:
    from Products.CMFDynamicViewFTI.interfaces import IBrowserDefault
except:
    from Products.CMFPlone.interfaces import IBrowserDefault
from Products.CMFPlone import PloneMessageFactory as _pmf
from Products.CMFPlone.browser.interfaces import INavigationTree
from Products.CMFPlone.browser.navtree import SitemapNavtreeStrategy

from plone.portlets.interfaces import IPortletManager, IPortletRenderer, IPortletDataProvider
from plone.portlets.utils import unhashPortletInfo

from plone.app.portlets.portlets.navigation import INavigationPortlet
from plone.app.portlets.utils import assignment_from_key
from plone.app.portlets.portlets import base
from plone.app.portlets.portlets import navigation

from plone.app.layout.navigation.root import getNavigationRoot
from plone.app.layout.navigation.navtree import buildFolderTree, NavtreeStrategyBase
from plone.app.layout.navigation.defaultpage import isDefaultPage
from plone.app.layout.navigation.interfaces import INavigationQueryBuilder, INavtreeStrategy

from plone.app.vocabularies.catalog import SearchableTextSourceBinder
from plone.app.form.widgets.uberselectionwidget import UberSelectionWidget

from .interfaces import *
from Solgema.NavigationPortlet.config import _
_logger = logging.getLogger(__name__)

def buildFolderTreeCustom(context, request, obj=None, query={}, strategy=NavtreeStrategyBase()):

    portal_state = getMultiAdapter((context, request), name=u'plone_portal_state')
    portal_catalog = getToolByName(context, 'portal_catalog')

    showAllParents = strategy.showAllParents
    rootPath = strategy.rootPath

    request = getattr(context, 'REQUEST', {})

    objPath = None
    objPhysicalPath = None
    if obj is not None:
        container = aq_parent(obj)
        objPhysicalPath = obj.getPhysicalPath()
        if isDefaultPage(container, obj):
            objPhysicalPath = objPhysicalPath[:-1]
        objPath = '/'.join(objPhysicalPath)

    portalObject = portal_state.portal()
    portalPath = '/'.join( portalObject.getPhysicalPath() )

    if 'path' not in query:
        if rootPath is None:
            rootPath = portalPath
        query['path'] = rootPath
    elif rootPath is None:
        pathQuery = query['path']
        if type(pathQuery) == StringType:
            rootPath = pathQuery
        else:
            # Adjust for the fact that in a 'navtree' query, the actual path
            # is the path of the current context
            if pathQuery.get('navtree', False):
                navtreeLevel = pathQuery.get('navtree_start', 1)
                if navtreeLevel > 1:
                    navtreeContextPath = pathQuery['query']
                    navtreeContextPathElements = navtreeContextPath[len(portalPath)+1:].split('/')
                    # Short-circuit if we won't be able to find this path
                    if len(navtreeContextPathElements) < (navtreeLevel - 1):
                        return {'children': []}
                    rootPath = portalPath + '/' + '/'.join(navtreeContextPathElements[:navtreeLevel-1])
                else:
                    rootPath = portalPath
            else:
                rootPath = pathQuery['query']

    rootDepth = len(rootPath.split('/'))

    pruneRoot = False
    if strategy is not None:
        rootObject = portalObject.unrestrictedTraverse(rootPath, None)
        if rootObject is not None:
            pruneRoot = not strategy.showChildrenOf(rootObject)

    if 'sort_on' not in query:
        query['sort_on'] = 'getObjPositionInParent'

    if 'is_default_page' not in query:
        query['is_default_page'] = False
    elif isinstance(query.get('is_default_page', None), (list, tuple)) and True in query.get('is_default_page') and False in query.get('is_default_page'):
        del query['is_default_page']

    results = portal_catalog.searchResults(query)

    itemPaths = {}

    itemPaths[rootPath] = {'children': []}

    if pruneRoot:
        itemPaths[rootPath]['_pruneSubtree'] = True

    def insertElement(itemPaths, item, forceInsert=False):
    
        itemPath = item.getPath()
        itemInserted = (itemPaths.get(itemPath, {}).get('item', None) is not None)
        if not forceInsert and itemInserted:
            return

        itemPhysicalPath = itemPath.split('/')
        parentPath = '/'.join(itemPhysicalPath[:-1])
        parentPruned = (itemPaths.get(parentPath, {}).get('_pruneSubtree', False))

        if not forceInsert and parentPruned:
            return

        isCurrent = isCurrentParent = False
        if objPath is not None:
            if objPath == itemPath:
                isCurrent = True
            elif objPath.startswith(itemPath + '/') and len(objPhysicalPath) > len(itemPhysicalPath):
                isCurrentParent = True

        relativeDepth = len(itemPhysicalPath) - rootDepth

        newNode = {'item': item,
                   'depth': relativeDepth,
                   'currentItem': isCurrent,
                   'currentParent': isCurrentParent, }

        insert = True
        if not forceInsert and strategy is not None:
            insert = strategy.nodeFilter(newNode)
        if insert:

            if strategy is not None:
                newNode = strategy.decoratorFactory(newNode)
                
            if parentPath in itemPaths:
                itemParent = itemPaths[parentPath]
                if forceInsert:
                    nodeAlreadyInserted = False
                    for i in itemParent['children']:
                        if i['item'].getPath() == itemPath:
                            nodeAlreadyInserted = True
                            break
                    if not nodeAlreadyInserted:
                        itemParent['children'].append(newNode)
                elif not itemParent.get('_pruneSubtree', False):
                    itemParent['children'].append(newNode)
            else:
                itemPaths[parentPath] = {'children': [newNode]}

            if strategy.showAllParents and isCurrentParent:
                expand = True
            else:
                expand = getattr(item, 'is_folderish', True)
            if expand and (not forceInsert and strategy is not None):
                expand = strategy.subtreeFilter(newNode)

            children = newNode.setdefault('children', [])
            if expand:
                if itemPath in itemPaths:
                    children.extend(itemPaths[itemPath]['children'])
            else:
                newNode['_pruneSubtree'] = True

            itemPaths[itemPath] = newNode

    for r in results:
        insertElement(itemPaths, r)

    if strategy.showAllParents and objPath is not None:
        objSubPathElements = objPath[len(rootPath)+1:].split('/')
        parentPaths = []

        haveNode = (itemPaths.get(rootPath, {}).get('item', None) is None)
        if not haveNode:
            parentPaths.append(rootPath)

        parentPath = rootPath
        for i in range(len(objSubPathElements)):
            nodePath = rootPath + '/' + '/'.join(objSubPathElements[:i+1])
            node = itemPaths.get(nodePath, None)

            if node is None or 'item' not in node:
                parentPaths.append(nodePath)
            else:
                nodeParent = itemPaths.get(parentPath, None)
                if nodeParent is not None:
                    nodeAlreadyInserted = False
                    for i in nodeParent['children']:
                        if i['item'].getPath() == nodePath:
                            nodeAlreadyInserted = True
                            break
                    if not nodeAlreadyInserted:
                        nodeParent['children'].append(node)

            parentPath = nodePath

        if len(parentPaths) > 0:
            query = {'path': {'query': parentPaths, 'depth': 0}}
            results = portal_catalog.unrestrictedSearchResults(query)

            for r in results:
                insertElement(itemPaths, r, forceInsert=True)

    return itemPaths[rootPath]

class navTreeItem( BrowserPage ):
    _contenttemplate = ViewPageTemplateFile('contentnavigation.pt')
    _recurse_old = ViewPageTemplateFile('navigation_recurse_old.pt')
    _recurse_p5 = ViewPageTemplateFile('navigation_recurse.pt')

    implements(InavTreeItem)

    def __init__(self, context, request):
        super(navTreeItem, self).__init__(context, request)
        self.urltool = getToolByName(self.context, 'portal_url')
        self.portal_state = getMultiAdapter((self.context, self.request), name=u'plone_portal_state')
        self.portal = self.portal_state.portal()
        self.data = {}
        self.root = context
        self.showAllParents = False
        self.hasContent = False
        self.portletRenderer = self.getPortletRenderer()
        self.data = self.portletRenderer.data

    def getPortletRenderer(self):
        portlethash = self.request.get('portlethash', '')
        info = unhashPortletInfo(portlethash) 
        manager = getUtility(IPortletManager, info['manager'])
        
        assignment = assignment_from_key(context = self.context, 
                                         manager_name = info['manager'], 
                                         category = info['category'],
                                         key = info['key'],
                                         name = info['name'])
        renderer = getMultiAdapter(
                (self.context, self.request, self, manager, assignment.data),
                IPortletRenderer
            )
        return renderer.__of__(self.context)

    def canUseContextualMenu(self):
        self.portletRenderer.canUseContextualMenu()

    def getContext(self):
        if hasattr(self.request, 'get') and self.request.get('navtreepath'):
            context = self.portal.restrictedTraverse(self.request.get('navtreepath'))
            if context:
                return context
        return self.context

    def navigationTreeRootPath(self):
        return '/'.join(self.portal_state.navigation_root().getPhysicalPath())

    @property
    def rootPath(self):
        return self.navigationTreeRootPath()

    def canManage(self):
        user = self.portal_state.member()
        return user and user.has_permission('List folder contents', self.context)

    def isMember(self):
        return not self.portal_state.anonymous()

    def getQuery(self, context):
        user = self.portal_state.member()

        portal_properties = getToolByName(context, 'portal_properties')
        navtree_properties = getattr(portal_properties, 'navtree_properties')

        # Acquire a custom nav query if available
        customQuery = getattr(context, 'getCustomNavQuery', None)
        if customQuery is not None and utils.safe_callable(customQuery):
            query = customQuery()
        else:
            query = {}

        # Construct the path query

        rootPath = self.navigationTreeRootPath()
        currentPath = '/'.join(context.getPhysicalPath())
        query['is_default_page'] = False
        # If we are above the navigation root, a navtree query would return
        # nothing (since we explicitly start from the root always). Hence,
        # use a regular depth-1 query in this case.

        if currentPath!=rootPath and not currentPath.startswith(rootPath+'/'):
            query['path'] = {'query' : rootPath, 'depth' : 1}
        else:
            query['path'] = {'query' : currentPath, 'navtree' : 1}

        # XXX: It'd make sense to use 'depth' for bottomLevel, but it doesn't
        # seem to work with EPI.

        # Only list the applicable types
        ploneUtils = getToolByName(self.context, 'plone_utils')
        friendlyTypes = ploneUtils.getUserFriendlyTypes()
        if 'MemberDataContainer' in friendlyTypes:
            friendlyTypes.remove('MemberDataContainer')
        query['portal_type'] = friendlyTypes

        # Apply the desired sort
        sortAttribute = navtree_properties.getProperty('sortAttribute', None)
        if sortAttribute is not None:
            query['sort_on'] = sortAttribute
            sortOrder = navtree_properties.getProperty('sortOrder', None)
            if sortOrder is not None:
                query['sort_order'] = sortOrder

        # Filter on workflow states, if enabled
        if not user or not user.has_permission('List folder contents', self.context):
            if navtree_properties.getProperty('enable_wf_state_filtering', False):
                query['review_state'] = navtree_properties.getProperty('wf_states_to_show', ())
        return query

    @instance.memoize
    def getNavTree(self, context=None):
        if not context:
            context = self.getContext()
        if self.request.get('navtreepath'):
            canUseScrollPane = self.portletRenderer.canUseScrollPane()
            if not canUseScrollPane or ( canUseScrollPane and not self.portletRenderer.canManage()):
                queryBuilder = getMultiAdapter((context, self.data), INavigationQueryBuilder)
                strategy = getMultiAdapter((context, self.data), INavtreeItemStrategy)
                return buildFolderTree(context, obj=context, query=queryBuilder(), strategy=strategy)
            strategy = getMultiAdapter((context, self), ISManagerContentNavtreeStrategy)
            return buildFolderTreeCustom(context, self.request, obj=context, query=self.getQuery(context), strategy=strategy)
        return None

    @instance.memoize
    def createNavTree(self, navtreepath=None, level=0):
        context = self.portal.restrictedTraverse(navtreepath)
        datas = self.getNavTree(context)
        base_childs = datas.copy()
        childs = base_childs.get('children', [])
        firstItem = ''
        lastItem = ''
        i = 0
        hasChild = False
        for child in childs:
            if child.get('children', None):
                hasChild = True

        if childs and hasChild:
            while i < len(childs):
                while childs[i].get('children', []):
                    newchilds = childs[i].copy()
                    subchilds = newchilds.get('children')
                    newchilds['children'] = []
                    childs = [childs[a] for a in range(len(childs)) if a != i]
                    childs.insert(i, newchilds)
                    for j in range(len(subchilds)):
                        childs.insert(i+j+1, subchilds[0])
                    i = 0
                else:
                    i += 1
            baseChildren = self.getNavTree().get('children', [])
        return self.recurse(children=self.getNavTree().get('children', []), level=level+1, bottomLevel=0, firstItem=firstItem, lastItem=lastItem, childs=str(childs))

    def recurse(self, children=[], level=None, bottomLevel=0, firstItem='', lastItem='', childs=''):
        if getFSVersionTuple()[0] == 4:
            return xhtml_compress(self._recurse_old(children=children, level=level, bottomLevel=bottomLevel, firstItem=firstItem, lastItem=lastItem, childs=childs))
        return xhtml_compress(self._recurse_p5(children=children, level=level, bottomLevel=bottomLevel, firstItem=firstItem, lastItem=lastItem, childs=childs))

    def __call__(self):
        if self.request.get('navtreepath', None):
            level = int(self.request.get('navtreelevel', 0)) + 1
            navtreepath = self.request.get('navtreepath', None)
            return xhtml_compress(self._contenttemplate(navtreepath=navtreepath, level=level))
        return None

class Assignment(navigation.Assignment):
    implements(ISolgemaNavigationPortlet)

    useScrollPane = True
    allowedRolesToUseScrollPane = ['Manager', 'Site Administrator']
    useContextualMenu = True
    allowedRolesToUseContextualMenu = ['Manager', 'Site Administrator']
    
    def __init__(self, name=u"", root=None, currentFolderOnly=False, includeTop=False, topLevel=1, bottomLevel=0, useScrollPane=True, allowedRolesToUseScrollPane=['Manager', 'Site Administrator'], useContextualMenu=True, allowedRolesToUseContextualMenu=['Manager', 'Site Administrator']):
        super(Assignment, self).__init__(name, root, currentFolderOnly, includeTop, topLevel, bottomLevel)
        self.useScrollPane = useScrollPane
        self.allowedRolesToUseScrollPane = allowedRolesToUseScrollPane
        self.useContextualMenu = useContextualMenu
        self.allowedRolesToUseContextualMenu = allowedRolesToUseContextualMenu

class Renderer(navigation.Renderer):

    _template_old = ViewPageTemplateFile('navigation_old.pt')
    _template_p5 = ViewPageTemplateFile('navigation.pt')
    _recurse_old = ViewPageTemplateFile('navigation_recurse_old.pt')
    _recurse_p5 = ViewPageTemplateFile('navigation_recurse.pt')

    def __init__(self, context, request, view, manager, data):
        super(Renderer, self).__init__(context, request, view, manager, data)
        self.portal_state = getMultiAdapter((context, request), name=u'plone_portal_state')
        portal_properties = getToolByName(context, 'portal_properties')
        self.properties = getattr(portal_properties, 'navtree_properties', None)
        
    @property
    def available(self):
        return True
        rootpath = self.getNavRootPath()
        if rootpath is None and not self.canManage():
            return False

        tree = self.getNavTree()
        root = self.getNavRoot()
        return (root is not None and len(tree['children']) > 0)
        
    def include_top(self):
        if self.canUseScrollPane() and self.canManage():
            return True
        return getattr(self.data, 'includeTop', self.properties and self.properties.getProperty('includeTop', None) or None)

    @memoize
    def canUseContextualMenu(self):
        if getattr(self.data, 'useContextualMenu', False):
            return self.allowedToUseContextualMenu()

    def allowedToUseContextualMenu(self):
        user = self.portal_state.member()
        for role in getattr(self.data, 'allowedRolesToUseContextualMenu', []):
            if user.has_role(role):
                return True
        return False

    @memoize
    def canUseScrollPane(self):
        if getattr(self.data, 'useScrollPane', False):
            return self.allowedToUseScrollPane()
        return False

    def allowedToUseScrollPane(self):
        roles = getattr(self.data, 'allowedRolesToUseScrollPane', [])
        user = self.portal_state.member()
        if not user and 'Anonymous' in roles:
            return True
        elif user and 'Authenticated' in roles:
            return True
        for role in roles:
            if user.has_role(role):
                return True
        return False

    def navigation_root(self):
        return self.getNavRoot()

    def root_type_name(self):
        root = self.getNavRoot()
        return queryUtility(IIDNormalizer).normalize(root.portal_type)

    def root_item_class(self):
        context = aq_inner(self.context)
        root = self.getNavRoot()
        isDefaultPage = utils.isDefaultPage(context, self.request) 
        if (aq_base(root) is aq_base(context) or
                (aq_base(root) is aq_base(aq_parent(aq_inner(context))) and isDefaultPage)):
            return 'navTreeCurrentItem'
        else:
            return ''
            
    def root_icon(self):
        ploneview = getMultiAdapter((self.context, self.request), name=u'plone')
        icon = ploneview.getIcon(self.getNavRoot())
        return icon.url
            
    def root_is_portal(self):
        root = self.getNavRoot()
        return aq_base(root) is aq_base(self.urltool.getPortalObject())

    @memoize
    def getNavRoot(self, _marker=[]):
        portal = self.portal_state.portal()
        currentFolderOnly = self.data.currentFolderOnly or self.properties and self.properties.getProperty('currentFolderOnlyInNavtree', False) or False
        topLevel = self.data.topLevel or self.properties and self.properties.getProperty('topLevel', 0) or 0
        if self.canUseScrollPane() and self.canManage():
            topLevel = 0
        rootPath = getRootPath(self.context, currentFolderOnly, topLevel, self.data.root)
        
        if rootPath == self.urltool.getPortalPath():
            return portal
        else:
            try:
                return portal.unrestrictedTraverse(rootPath)
            except (AttributeError, KeyError,):
                return portal

    def createNavTree(self, context=None):
        datas = self.getNavTree()
        base_childs = datas.copy()
        childs = base_childs.get('children', [])

        firstItem = ''
        lastItem = ''
        i = 0
        hasChild = False
        for child in childs:
            if child.get('children', None):
                hasChild = True

        if childs:
            baseChildren = self.getNavTree().get('children', [])
            firstItem = baseChildren and baseChildren[0]['getURL'] or None
            lastChild = childs[-1]
            if not lastChild.get('children'):
                lastItem = lastChild['getURL']
            else:
                while lastChild.get('children'):
                    lastChild = lastChild.get('children')[-1]
                lastItem = lastChild['getURL']

        bottomLevel = self.data.bottomLevel or self.properties and self.properties.getProperty('bottomLevel', 0) or 0
        return self.recurse(children=self.getNavTree().get('children', []), level=1, bottomLevel=bottomLevel, firstItem=firstItem, lastItem=lastItem, childs=str(childs))

    def canManage(self):
        user = self.portal_state.member()
        return user and user.has_permission('List folder contents', self.context)

#    @memoize
    def getNavTree(self, _marker=[]):
        context = aq_inner(self.context)
        canUseScrollPane = self.canUseScrollPane()
        if not canUseScrollPane or ( canUseScrollPane and not self.canManage()):
            queryBuilder = getMultiAdapter((context, self.data), INavigationQueryBuilder)
            strategy = getMultiAdapter((context, self.data), INavtreeStrategy)
            return buildFolderTree(context, obj=context, query=queryBuilder(), strategy=strategy)

        parent = aq_parent(context)
        if parent:
            meta_type = getattr(aq_base(parent), 'meta_type', '')
            if meta_type == 'TempFolder':
                context = aq_parent(aq_parent(parent))

        queryBuilder = getMultiAdapter((context, self.data), ISManagerNavigationQueryBuilder)
        strategy = getMultiAdapter((context, self.data), ISManagerNavtreeStrategy)

        return buildFolderTreeCustom(context, self.request, obj=context, query=queryBuilder(), strategy=strategy)

    def isMember(self):
        return not self.portal_state.anonymous()

    def update(self):
        pass

    def render(self):
        if getFSVersionTuple()[0] == 4:
            return xhtml_compress(self._template_old())
        return xhtml_compress(self._template_p5())

    def recurse(self, children=[], level=None, bottomLevel=0, firstItem='', lastItem='', childs=''):
        if getFSVersionTuple()[0] == 4:
            return xhtml_compress(self._recurse_old(children=children, level=level, bottomLevel=bottomLevel, firstItem=firstItem, lastItem=lastItem, childs=childs, include_top=self.include_top()))
        return xhtml_compress(self._recurse_p5(children=children, level=level, bottomLevel=bottomLevel, firstItem=firstItem, lastItem=lastItem, childs=childs, include_top=self.include_top()))

class AddForm(base.AddForm):
    schema = ISolgemaNavigationPortlet
    form_fields = form.Fields(ISolgemaNavigationPortlet)
    if form_fields.get('root'):
        form_fields['root'].custom_widget = UberSelectionWidget
    label = _pmf(u"Add Navigation Portlet")
    description = _pmf(u"This portlet display a navigation tree.")

    def create(self, data):
        if data.get('root'):
            return Assignment(name=data.get('name', u""),
                              root=data.get('root', u""),
                              currentFolderOnly=data.get('currentFolderOnly', False),
                              includeTop=data.get('includeTop', False),
                              topLevel=data.get('topLevel', 0),
                              bottomLevel=data.get('bottomLevel', 0),
                              useScrollPane=data.get('useScrollPane', True),
                              allowedRolesToUseScrollPane=data.get('allowedRolesToUseScrollPane', True))
        else:
            return Assignment(name=data.get('name', u""),
                              root=data.get('root_uid', u""),
                              currentFolderOnly=data.get('currentFolderOnly', False),
                              includeTop=data.get('includeTop', False),
                              topLevel=data.get('topLevel', 0),
                              bottomLevel=data.get('bottomLevel', 0),
                              useScrollPane=data.get('useScrollPane', True),
                              allowedRolesToUseScrollPane=data.get('allowedRolesToUseScrollPane', True))

class EditForm(base.EditForm):
    schema = ISolgemaNavigationPortlet
    
    form_fields = form.Fields(ISolgemaNavigationPortlet)
    if form_fields.get('root'):
        form_fields['root'].custom_widget = UberSelectionWidget
    label = _pmf(u"Edit Navigation Portlet")
    description = _pmf(u"This portlet display a navigation tree.")

class QueryBuilder(object):
    """Build a navtree query based on the settings in navtree_properties
    and those set on the portlet.
    """
    implements(ISNavigationQueryBuilder)
    adapts(Interface, ISolgemaNavigationPortlet)

    def __init__(self, context, portlet):
        self.context = context
        self.portlet = portlet

        portal_url = getToolByName(context, 'portal_url')
        portal = portal_url.getPortalObject()
        portal_properties = getToolByName(context, 'portal_properties')
        navtree_properties = getattr(portal_properties, 'navtree_properties')
        pm = getToolByName(portal,'portal_membership')
        user = pm.getAuthenticatedMember()
        
        # Acquire a custom nav query if available
        customQuery = getattr(context, 'getCustomNavQuery', None)
        if customQuery is not None and utils.safe_callable(customQuery):
            query = customQuery()
        else:
            query = {}

        # Construct the path query
        if hasattr(portlet, 'root'):
            root = portlet.root
        else:
            root = uuidToObject(portlet.root_uid)
        rootPath = getNavigationRoot(context, relativeRoot=root)
        currentPath = '/'.join(context.getPhysicalPath())

        # If we are above the navigation root, a navtree query would return
        # nothing (since we explicitly start from the root always). Hence,
        # use a regular depth-1 query in this case.

        query['path'] = {'query' : rootPath, 'depth' : 2}

        topLevel = portlet.topLevel or navtree_properties.getProperty('topLevel', 0)
        if topLevel and topLevel > 0:
             query['path']['navtree_start'] = topLevel + 1

        # XXX: It'd make sense to use 'depth' for bottomLevel, but it doesn't
        # seem to work with EPI.

        # Only list the applicable types
        query['portal_type'] = utils.typesToList(context)

        # Apply the desired sort
        sortAttribute = navtree_properties.getProperty('sortAttribute', None)
        if sortAttribute is not None:
            query['sort_on'] = sortAttribute
            sortOrder = navtree_properties.getProperty('sortOrder', None)
            if sortOrder is not None:
                query['sort_order'] = sortOrder

        # Filter on workflow states, if enabled
        if not user or not user.has_permission('List folder contents', self.context):
            if navtree_properties.getProperty('enable_wf_state_filtering', False):
                query['review_state'] = navtree_properties.getProperty('wf_states_to_show', ())

        self.query = query

    def __call__(self):
        return self.query

class ManagerQueryBuilder(object):
    """Build a navtree query based on the settings in navtree_properties
    and those set on the portlet.
    """
    implements(ISManagerNavigationQueryBuilder)
    adapts(Interface, ISolgemaNavigationPortlet)

    def __init__(self, context, portlet):
        self.context = context
        self.portlet = portlet

        portal_properties = getToolByName(context, 'portal_properties')
        navtree_properties = getattr(portal_properties, 'navtree_properties')

        portal_url = getToolByName(context, 'portal_url')
        pm = getToolByName(context,'portal_membership')
        user = pm.getAuthenticatedMember()

        customQuery = getattr(context, 'getCustomNavQuery', None)
        if customQuery is not None and utils.safe_callable(customQuery):
            query = customQuery()
        else:
            query = {}
        if hasattr(portlet, 'root'):
            root = portlet.root
        else:
            root = uuidToObject(portlet.root_uid)
        rootPath = getNavigationRoot(context, relativeRoot=root)
        currentPath = '/'.join(context.getPhysicalPath())

        query['path'] = {'query' : currentPath, 'navtree' : 1, 'navtree_start':0}

        sortAttribute = navtree_properties.getProperty('sortAttribute', None)
        if sortAttribute is not None:
            query['sort_on'] = sortAttribute
            sortOrder = navtree_properties.getProperty('sortOrder', None)
            if sortOrder is not None:
                query['sort_order'] = sortOrder

        # Filter on workflow states, if enabled
        if not user or not user.has_permission('List folder contents', self.context):
            if navtree_properties.getProperty('enable_wf_state_filtering', False):
                query['review_state'] = navtree_properties.getProperty('wf_states_to_show', ())

        ploneUtils = getToolByName(self.context, 'plone_utils')
        friendlyTypes = ploneUtils.getUserFriendlyTypes()
        if 'MemberDataContainer' in friendlyTypes:
            friendlyTypes.remove('MemberDataContainer')
        query['portal_type'] = friendlyTypes
        query['is_default_page'] = [False, True]
        self.query = query

    def __call__(self):
        return self.query
        
class NavtreeStrategy(SitemapNavtreeStrategy):
    """The navtree strategy used for the default navigation portlet
    """
    implements(INavtreeStrategy)
    adapts(Interface, ISolgemaNavigationPortlet)

    def __init__(self, context, portlet):
        SitemapNavtreeStrategy.__init__(self, context, portlet)
        portal_properties = getToolByName(context, 'portal_properties')
        navtree_properties = getattr(portal_properties, 'navtree_properties')
        
        # XXX: We can't do this with a 'depth' query to EPI...
        self.bottomLevel = portlet.bottomLevel or navtree_properties.getProperty('bottomLevel', 0)

        currentFolderOnly = portlet.currentFolderOnly or navtree_properties.getProperty('currentFolderOnlyInNavtree', False)
        topLevel = portlet.topLevel or navtree_properties.getProperty('topLevel', 0)
        if hasattr(portlet, 'root'):
            root = portlet.root
        else:
            root = uuidToObject(portlet.root_uid)
        self.rootPath = getRootPath(context, currentFolderOnly, topLevel, root)

    def subtreeFilter(self, node):
        sitemapDecision = SitemapNavtreeStrategy.subtreeFilter(self, node)
        if sitemapDecision == False:
            return False
        depth = node.get('depth', 0)
        if depth > 0 and self.bottomLevel > 0 and depth >= self.bottomLevel:
            return False
        else:
            return True

class NavtreeItemStrategy(SitemapNavtreeStrategy):
    """The navtree strategy used for the default navigation portlet
    """
    implements(INavtreeItemStrategy)
    adapts(Interface, ISolgemaNavigationPortlet)

    def __init__(self, context, portlet):
        SitemapNavtreeStrategy.__init__(self, context, portlet)
        self.bottomLevel = 0
        currentFolderOnly = True
        topLevel = 0
        root = getattr(portlet, 'root', uuidToObject(portlet.root_uid))
        self.rootPath = getRootPath(context, currentFolderOnly, topLevel, root)

class ManagerNavtreeStrategy(SitemapNavtreeStrategy):
    """The navtree strategy used for the default navigation portlet
    """
    implements(ISManagerNavtreeStrategy)
    adapts(Interface, ISolgemaNavigationPortlet)

    def __init__(self, context, portlet):
        SitemapNavtreeStrategy.__init__(self, context, portlet)
        self.bottomLevel = 0
        currentFolderOnly = False
        topLevel = 0
        if hasattr(portlet, 'root'):
            root = portlet.root
        else:
            root = uuidToObject(portlet.root_uid)
        self.rootPath = getRootPath(context, currentFolderOnly, topLevel, root)

    def subtreeFilter(self, node):
        return True

    def decoratorFactory(self, node):
        context = aq_inner(self.context)
        portal_url = getToolByName(context, 'portal_url')
        portal = portal_url.getPortalObject()
        request = context.REQUEST
        
        newNode = node.copy()
        item = node['item']

        portalType = getattr(item, 'portal_type', None)
        itemUrl = item.getURL()
        if portalType is not None and portalType in self.viewActionTypes:
            itemUrl += '/view'

        useRemoteUrl = False
        getRemoteUrl = getattr(item, 'getRemoteUrl', None)
        isCreator = self.memberId == getattr(item, 'Creator', None)
        if getRemoteUrl and not isCreator:
            useRemoteUrl = True

        isFolderish = getattr(item, 'is_folderish', None)
        showChildren = False
        if isFolderish and (portalType is None or portalType not in self.parentTypesNQ):
            showChildren = True

        ploneview = getMultiAdapter((portal, request), name=u'plone')
        newNode['Title'] = utils.pretty_title_or_id(context, item)
        newNode['id'] = item.getId
        newNode['UID'] = item.UID
        newNode['absolute_url'] = itemUrl
        newNode['getURL'] = itemUrl
        newNode['path'] = item.getPath()
        newNode['item_icon'] = ploneview.getIcon(item)
        newNode['Creator'] = getattr(item, 'Creator', None)
        newNode['creation_date'] = getattr(item, 'CreationDate', None)
        newNode['portal_type'] = portalType
        newNode['review_state'] = getattr(item, 'review_state', None)
        newNode['Description'] = getattr(item, 'Description', None)
        newNode['show_children'] = showChildren
        newNode['no_display'] = False  # We sort this out with the nodeFilter
        # BBB getRemoteUrl and link_remote are deprecated, remove in Plone 4
        newNode['getRemoteUrl'] = getattr(item, 'getRemoteUrl', None)
        newNode['useRemoteUrl'] = useRemoteUrl
        newNode['link_remote'] = newNode['getRemoteUrl'] and newNode['Creator'] != self.memberId

        idnormalizer = queryUtility(IIDNormalizer)
        newNode['normalized_portal_type'] = idnormalizer.normalize(portalType)
        newNode['normalized_review_state'] = idnormalizer.normalize(newNode['review_state'])
        newNode['normalized_id'] = idnormalizer.normalize(newNode['id'])
        newNode['is_default_page'] = getattr(item, 'is_default_page', None)
        newNode['exclude_from_nav'] = getattr(item, 'exclude_from_nav', None)
        return newNode

class ManagerContentNavtreeStrategy(ManagerNavtreeStrategy):
    """The navtree strategy used for the default navigation portlet
    """
    implements(ISManagerContentNavtreeStrategy)
    adapts(Interface, ISolgemaNavigationPortlet)

    def __init__(self, context, portlet):
        SitemapNavtreeStrategy.__init__(self, context, portlet)
        currentFolderOnly = True
        topLevel = 0
        if hasattr(portlet, 'root'):
            root = portlet.root
        else:
            root = uuidToObject(portlet.root_uid)
        self.rootPath = getRootPath(context, currentFolderOnly, topLevel, root)
            
def getRootPath(context, currentFolderOnly, topLevel, root):
    """Helper function to calculate the real root path
    """
    context = aq_inner(context)
    if currentFolderOnly:
        folderish = getattr(aq_base(context), 'isPrincipiaFolderish', False) and not INonStructuralFolder.providedBy(context)
        parent = aq_parent(context)
        
        is_default_page = False
        browser_default = IBrowserDefault(parent, None)
        if browser_default is not None:
            is_default_page = (browser_default.getDefaultPage() == context.getId())
        
        if not folderish:
            return '/'.join(parent.getPhysicalPath())
        else:
            return '/'.join(context.getPhysicalPath())

    rootPath = getNavigationRoot(context, relativeRoot=root)

    # Adjust for topLevel
    if topLevel > 0:
        contextPath = '/'.join(context.getPhysicalPath())
        if not contextPath.startswith(rootPath):
            return None
        contextSubPathElements = contextPath[len(rootPath)+1:]
        if contextSubPathElements:
            contextSubPathElements = contextSubPathElements.split('/')
            if len(contextSubPathElements) < topLevel:
                return None
            rootPath = rootPath + '/' + '/'.join(contextSubPathElements[:topLevel])
        else:
            return None
    
    return rootPath
    
