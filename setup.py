from setuptools import setup, find_packages
import os

version = '1.1'

setup(name='Solgema.NavigationPortlet',
      version=version,
      description="Solgema",
      long_description=(open("README.txt").read() + "\n" +
                        open(os.path.join("docs", "HISTORY.txt")).read()),
      # Get more strings from
      # http://pypi.python.org/pypi?%3Aaction=list_classifiers
      classifiers=[
          "Framework :: Plone",
          "Programming Language :: Python",
          "Topic :: Software Development :: Libraries :: Python Modules",
          ],
      keywords='Solgema, blinks, backlinks',
      author='Martronic SA',
      author_email='martronic@martronic.ch',
      url='http://www.martronic.ch',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['Solgema'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'Solgema.ContextualContentMenu',
          'plone.app.form'
          # -*- Extra requirements: -*-
      ],
      entry_points="""
      # -*- Entry points: -*-
      [z3c.autoinclude.plugin]
      target = plone
      """,
      )
