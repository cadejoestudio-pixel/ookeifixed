import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ProductCard = ({ product, index = 0, variant = "default" }) => {
  const isLarge = variant === "large";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`group relative ${
        isLarge ? "col-span-1 md:col-span-2 row-span-1 md:row-span-2" : ""
      }`}
      data-testid={`product-card-${product.slug}`}
    >
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image Container */}
        <div
          className={`relative overflow-hidden bg-secondary ${
            isLarge ? "aspect-[4/5] md:aspect-square" : "aspect-[4/5]"
          }`}
        >
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Limited Badge */}
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-white px-3 py-1.5 border border-black/10">
              LIMITED /{product.max_edition}
            </span>
          </div>

          {/* Quick Info on Hover */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              View Product
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 border-b border-r border-black/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase text-accent mb-1">
                {product.drop}
              </p>
              <h3 className="text-sm md:text-base font-bold uppercase tracking-tight truncate group-hover:text-accent transition-colors">
                {product.name}
              </h3>
            </div>
            <p className="text-sm md:text-base font-bold whitespace-nowrap">
              ${product.price.toFixed(2)}
            </p>
          </div>

          {/* Inventory Indicator */}
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-accent animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              {product.total_inventory} pieces left
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
