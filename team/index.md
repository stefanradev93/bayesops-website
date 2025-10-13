---
title: Team
nav:
  order: 3
  tooltip: About our team
---

# {% include icon.html icon="fa-solid fa-users" %}Team

BayesOps brings together researchers from Rensselaer Polytechnic Institute and affiliated members from partner institutions to advance collaborative research in probabilistic and cognitive modeling. 

{% include section.html %}

## Core Members

{% include list.html data="members" component="portrait" filter="role == 'pi'" %}
{% include list.html data="members" component="portrait" filter="role == 'postdoc'" %}
{% include list.html data="members" component="portrait" filter="role == 'phd'" %}
{% include list.html data="members" component="portrait" filter="role == 'msc'" %}
{% include list.html data="members" component="portrait" filter="role == 'undergrad'" %}

{% include section.html %}

## Affiliated Members

{% include list.html data="members" component="portrait" filter="role == 'affiliate'" %}
