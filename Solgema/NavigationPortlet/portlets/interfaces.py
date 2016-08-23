from zope.interface import Interface
from zope import schema
from plone.portlets.interfaces import IPortletAssignmentMapping
from plone.portlets.interfaces import IPortletManager
from plone.portlets.interfaces import IPortletManagerRenderer
from plone.portlets.interfaces import IPlacelessPortletManager
from plone.portlets.interfaces import IPortletRenderer
from plone.portlets.interfaces import IPortletRetriever
from plone.app.portlets.interfaces import IColumn
from plone.app.portlets.interfaces import ILeftColumn
from plone.app.portlets.interfaces import IRightColumn
from plone.app.portlets.portlets.navigation import INavigationPortlet
from plone.app.layout.navigation.interfaces import INavtreeStrategy
from Solgema.NavigationPortlet.config import _

class InavTreeItem(Interface):
    """A View that render a part of the navtree"""

class INavtreeItemStrategy(INavtreeStrategy):
    """An interface for the navtreeitem strategy"""

class ISolgemaNavigationPortlet(INavigationPortlet):
    """A portlet which can render the navigation tree
    """

    useScrollPane = schema.Bool(
            title=_(u"label_useScrollPane",
                    default=u"Use scrollpane in navigation portlet."),
            description=_(u"help_useScrollPane",
                          default=u"If selected, the navtree items will be expandable through javascript and a vertical scrollbar will be displayed in the portlet, permitting to keep a reasonable height."),
            default=True,
            required=False)

    allowedRolesToUseScrollPane = schema.List(title=_(u'label_allowedRolesToUseScrollPane', default=u"ScrollPane Roles"),
            description=_(u'help_allowedRolesToToUseScrollPane',
                        default=u"Roles that can use the scrollPane portlet. If the user hasn't one of the selected roles, the default Navigation portlet will be displayed."),
            value_type=schema.Choice(vocabulary="plone.app.vocabularies.AllRoles"),
            default=['Manager', 'Site Administrator'],
            required=False)

    useContextualMenu = schema.Bool(
            title=_(u"label_useContextualMenu",
                    default=u"Use Contextual Menu."),
            description=_(u"help_useContextualMenu",
                          default=u"If selected, the contextual content menu will be activated."),
            default=True,
            required=False)

    allowedRolesToUseContextualMenu = schema.List(title=_(u'label_allowedRolesToUseContextualMenu', default=u"Contextual Menu Roles"),
            description=_(u'help_allowedRolesToUseContextualMenu',
                        default=u"Roles that can use the contextual content menu."),
            value_type=schema.Choice(vocabulary="plone.app.vocabularies.Roles"),
            default=['Manager', 'Site Administrator'],
            required=False)

class ISNavigationQueryBuilder(Interface):
    """An object which returns a catalog query when called, used to 
    construct a navigation tree.
    """
    
    def __call__():
        """Returns a mapping describing a catalog query used to build a
           navigation structure.
        """

class ISManagerNavigationQueryBuilder(Interface):
    """An object which returns a catalog query when called, used to 
    construct a navigation tree.
    """
    
    def __call__():
        """Returns a mapping describing a catalog query used to build a
           navigation structure.
        """

class ISManagerContentNavtreeQueryBuilder(Interface):
    
    def __call__():
        """Returns a mapping describing a catalog query used to build a
           navigation structure.
        """

class ISManagerNavtreeStrategy(INavtreeStrategy):

    def subtreeFilter():
        """Returns a filter.
        """


class ISManagerContentNavtreeStrategy(INavtreeStrategy):

    def subtreeFilter():
        """Returns a filter.
        """
