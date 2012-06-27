from operator import attrgetter

from zope.i18n import translate
from zope.i18nmessageid import MessageFactory
from zope.interface import implements
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary
from zope.site.hooks import getSite

from Acquisition import aq_get
from Products.CMFCore.utils import getToolByName

PMF = MessageFactory('plone')


class AllRolesVocabulary(object):

    implements(IVocabularyFactory)

    def __call__(self, context):
        site = getSite()
        mtool = getToolByName(site, 'portal_membership', None)
        if mtool is None:
            return SimpleVocabulary([])

        items = []
        request = aq_get(mtool, 'REQUEST', None)
        roles = mtool.getPortalRoles()
        for role_id in roles:
            role_title = translate(PMF(role_id), context=request)
            items.append(SimpleTerm(role_id, role_id, role_title))
        items.append(SimpleTerm('Authenticated','Authenticated',PMF(u'Logged-in users')))
        items.append(SimpleTerm('Anonymous','Anonymous',PMF(u'label_anonymous_user')))
        items.sort(key=attrgetter('title'))
        return SimpleVocabulary(items)

AllRolesVocabularyFactory = AllRolesVocabulary()
