export const loadHome=(req,res)=>{
    try {
        // --- This is placeholder data ---
        // You would fetch this from your database
        const heroData = {
            title: 'SAMSUNG GALAXY S23 ULTRA 5G',
            subtitle: 'The Future in Your Hand. Order now and get exclusive launch offers.',
            link: '/shop/s23-ultra',
            image: '/images/s23-ultra-hero.png' 
        };

        const latestProducts = [
            { name: 'iPhone 15 Pro', price: 999.00, imageUrl: '/images/iphone-15-pro.png', slug: 'iphone-15-pro' },
            { name: 'Galaxy S23', price: 799.00, imageUrl: '/images/galaxy-s23.png', slug: 'galaxy-s23' },
            { name: 'Pixel 8 Pro', price: 899.00, imageUrl: '/images/pixel-8-pro.png', slug: 'pixel-8-pro' },
            { name: 'OnePlus 11', price: 699.00, imageUrl: '/images/oneplus-11.png', slug: 'oneplus-11' }
        ];
        
        const popularProducts = [
            { name: 'Pixel 8 Pro', price: 899.00, imageUrl: '/images/pixel-8-pro.png', slug: 'pixel-8-pro' },
            { name: 'iPhone 15 Pro', price: 999.00, imageUrl: '/images/iphone-15-pro.png', slug: 'iphone-15-pro' },
            { name: 'Nothing Phone (2)', price: 599.00, imageUrl: '/images/nothing-phone.png', slug: 'nothing-phone-2' },
            { name: 'Galaxy S23', price: 799.00, imageUrl: '/images/galaxy-s23.png', slug: 'galaxy-s23' },
            { name: 'iPhone 15 Pro', price: 999.00, imageUrl: '/images/iphone-15-pro.png', slug: 'iphone-15-pro' },
            { name: 'Galaxy S23', price: 799.00, imageUrl: '/images/galaxy-s23.png', slug: 'galaxy-s23' },
            { name: 'Pixel 8 Pro', price: 899.00, imageUrl: '/images/pixel-8-pro.png', slug: 'pixel-8-pro' },
            { name: 'OnePlus 11', price: 699.00, imageUrl: '/images/oneplus-11.png', slug: 'oneplus-11' }
        ];
        // Render the index page and pass the data
        res.render('user/home', {
            heroData,
            latestProducts,
            popularProducts,
            pageTitle:"Home",
            pageCss:"home",
            pageJs:"home"
            // You can also pass bestSellers, reviews, etc.
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
}