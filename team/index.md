---
title: Team
nav:
  order: 3
  tooltip: About our team
---

# {% include icon.html icon="fa-solid fa-users" %}Team

BayesOps brings together researchers from Rensselaer Polytechnic Institute and affiliated members from partner labs around the world to advance collaborative research at the intersection of AI and probabilistic modeling. 

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
