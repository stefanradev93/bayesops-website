---
title: Contact
nav:
  order: 5
  tooltip: Email, address, and location
---

# {% include icon.html icon="fa-regular fa-envelope" %}Contact

If you are a student who wants to do research at the frontier of probabilistic modeling, drop me a mail or simply pass by the lab.

{%
  include button.html
  type="email"
  text="Email"
  link="radev@rpi.edu"
%}
{%
  include button.html
  type="address"
  tooltip="Our location on Google Maps for easy navigation"
  link="https://www.google.com/maps"
%}

{% include section.html %}

{% capture col1 %}

{%
  include figure.html
  image="images/photo.jpg"
  caption="Lorem ipsum"
%}

{% endcapture %}

{% capture col2 %}

{%
  include figure.html
  image="images/photo.jpg"
  caption="Lorem ipsum"
%}

{% endcapture %}

{% include cols.html col1=col1 col2=col2 %}

{% include section.html dark=true %}

{% capture col1 %}
Low Center for Industrial Innovation<br>
110 8th Street<br>
Troy, NY 12180
{% endcapture %}

{% capture col2 %}
{% endcapture %}

{% capture col3 %}
Cognitive Science Department<br>
110 8th Street<br>
Troy, NY 12180
{% endcapture %}


{% include cols.html col1=col1 col2=col2 col3=col3 %}
