import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="bipbop-microservices",
    version="0.0.2",
    author="Lucas Fernando Amorim",
    author_email="lf.amorim@bipbop.com.br",
    description="IPC between BIPBOP APPs",
    long_description=long_description,
    long_description_content_type="text/markdown",
    repository_url="https://github.com/bipbop/bipbop-microservices",
    url="https://github.com/bipbop/bipbop-microservices",
    packages=setuptools.find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Customer Service",
        "License :: OSI Approved :: MIT License",
    ],
    python_requires='>=3.6',
)
