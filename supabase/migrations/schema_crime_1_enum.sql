-- Commit the enum value before the following migration uses it in retained rows.
alter type trending_category_v3 add value if not exists 'crime' after 'news';
