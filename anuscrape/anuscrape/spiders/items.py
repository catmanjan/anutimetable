import scrapy


class AnuscrapeItem(scrapy.Item):
    id = scrapy.Field()
    name = scrapy.Field()
    info = scrapy.Field()
    location = scrapy.Field()
    hour = scrapy.Field()
    day = scrapy.Field()
    pass
