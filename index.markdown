---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

{% for article in site.articles %}
  <h2>
    <a href="{{ article.url }}">
      {{ article.title }}
    </a>
  </h2>
{% endfor %}