# RhodoniteTS Documentation

**Comprehensive Documentation Suite for RhodoniteTS Web3D Graphics Library**

> 📚 **Navigation Hub**: Access all documentation from this central index

---

## 📋 Documentation Index

### 🎯 **Core Documentation**

| Document | Purpose | Target Audience |
|----------|---------|-----------------|
| **[Project Index](./PROJECT_INDEX.md)** | Comprehensive navigation and architecture reference | All developers |
| **[API Overview](./API_OVERVIEW.md)** | Detailed API reference with code examples | Library users & contributors |
| **[Developer Workflow](./DEVELOPER_WORKFLOW.md)** | Complete development process guide | Contributors & maintainers |

### 📖 **Project Documentation** 

| Document | Purpose | Location |
|----------|---------|----------|
| **User Guide** | Installation and basic usage | [`../README.md`](../README.md) |
| **Development Guide** | Comprehensive development documentation | [`../CLAUDE.md`](../CLAUDE.md) |
| **Contributing Guide** | Contribution guidelines | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| **Generated API Docs** | TypeDoc API documentation | [`./api/`](./api/) |

---

## 🚀 Quick Start Guide

### For New Users
1. **Read**: [`../README.md`](../README.md) for installation and basic usage
2. **Explore**: [`PROJECT_INDEX.md`](./PROJECT_INDEX.md) for architecture overview
3. **Reference**: [`API_OVERVIEW.md`](./API_OVERVIEW.md) for detailed API examples

### For Contributors
1. **Setup**: [`DEVELOPER_WORKFLOW.md`](./DEVELOPER_WORKFLOW.md) for complete development setup
2. **Architecture**: [`PROJECT_INDEX.md`](./PROJECT_INDEX.md) for system understanding
3. **Guidelines**: [`../CLAUDE.md`](../CLAUDE.md) for comprehensive development guidance

### For Library Developers
1. **Architecture**: [`PROJECT_INDEX.md`](./PROJECT_INDEX.md) for component system understanding
2. **APIs**: [`API_OVERVIEW.md`](./API_OVERVIEW.md) for implementation patterns
3. **Workflow**: [`DEVELOPER_WORKFLOW.md`](./DEVELOPER_WORKFLOW.md) for development best practices

---

## 🏗️ Architecture Quick Reference

### **Core Systems**
- **Entity-Component-System (ECS)**: Scene graph management
- **Blittable Memory Architecture**: GPU-optimized data storage
- **Multi-API Rendering**: WebGL2 + WebGPU support
- **Node-Based Materials**: Flexible shader composition

### **Key Directories**
```
src/foundation/           # Core library functionality
├── core/                # ECS and memory management
├── components/          # Built-in components
├── math/               # Mathematical primitives
├── materials/          # Material and shader system
├── renderer/           # Rendering pipeline
└── ...                 # Additional modules

src/webgl/              # WebGL2 implementation
src/webgpu/             # WebGPU implementation
```

---

## 📚 Documentation Types

### **📑 Reference Documentation**
- **[API Overview](./API_OVERVIEW.md)**: Complete API reference with usage examples
- **[Generated API Docs](./api/)**: Detailed TypeDoc documentation for all classes and interfaces

### **🏗️ Architecture Documentation**  
- **[Project Index](./PROJECT_INDEX.md)**: System architecture and component relationships
- **[CLAUDE.md](../CLAUDE.md)**: Comprehensive development patterns and guidelines

### **🔧 Process Documentation**
- **[Developer Workflow](./DEVELOPER_WORKFLOW.md)**: Complete development lifecycle guide
- **[Contributing](../CONTRIBUTING.md)**: Contribution guidelines and setup

---

## 🎯 Documentation Goals

### **Comprehensive Coverage**
✅ Architecture patterns and design decisions  
✅ Complete API reference with examples  
✅ Development workflow and best practices  
✅ Quality assurance and testing strategies  
✅ Cross-references and navigation aids  

### **Target Audiences**
- **Library Users**: Installation, API usage, examples
- **Contributors**: Development setup, patterns, guidelines  
- **Maintainers**: Architecture decisions, workflow processes
- **Researchers**: Technical implementation details

---

## 🔄 Documentation Maintenance

### **Update Triggers**
- API changes or additions
- Architecture modifications  
- New development tools or processes
- Version releases
- Community feedback

### **Maintenance Process**
1. **Update Source**: Modify relevant documentation files
2. **Cross-Reference**: Update links and references
3. **Generate**: Rebuild TypeDoc API documentation (`yarn doc`)
4. **Validate**: Ensure all links and examples work
5. **Review**: Check for completeness and accuracy

---

## 🔍 Finding Information

### **By Use Case**

| Need | Start Here | Then Reference |
|------|------------|----------------|
| **Getting Started** | [`README.md`](../README.md) | [`API_OVERVIEW.md`](./API_OVERVIEW.md) |
| **Understanding Architecture** | [`PROJECT_INDEX.md`](./PROJECT_INDEX.md) | [`CLAUDE.md`](../CLAUDE.md) |
| **Contributing Code** | [`DEVELOPER_WORKFLOW.md`](./DEVELOPER_WORKFLOW.md) | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| **API Implementation** | [`API_OVERVIEW.md`](./API_OVERVIEW.md) | [`./api/`](./api/) |
| **Debugging Issues** | [`DEVELOPER_WORKFLOW.md`](./DEVELOPER_WORKFLOW.md) | [`CLAUDE.md`](../CLAUDE.md) |

### **By Component System**

| Component Type | Documentation Location |
|----------------|----------------------|
| **Core ECS** | [`PROJECT_INDEX.md#components`](./PROJECT_INDEX.md#components) |
| **Math Library** | [`API_OVERVIEW.md#mathematical-apis`](./API_OVERVIEW.md#mathematical-apis) |
| **Rendering** | [`API_OVERVIEW.md#rendering-apis`](./API_OVERVIEW.md#rendering-apis) |
| **Materials** | [`API_OVERVIEW.md#material-apis`](./API_OVERVIEW.md#material-apis) |
| **Asset Loading** | [`API_OVERVIEW.md#asset-apis`](./API_OVERVIEW.md#asset-apis) |

---

## 🌐 External Resources

### **Official Links**
- **Website**: https://librn.com/
- **Online Editor**: https://editor.librn.com/
- **GitHub**: https://github.com/actnwit/RhodoniteTS
- **NPM Package**: https://www.npmjs.com/package/rhodonite

### **Community**
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and community interaction
- **Examples**: Sample projects in [`../samples/`](../samples/) directory

---

## 💡 Contribution Guidelines

### **Documentation Contributions**
1. **Follow Existing Patterns**: Maintain consistency with current documentation style
2. **Cross-Reference**: Add appropriate links to related sections
3. **Code Examples**: Include working code examples where applicable
4. **Target Audience**: Write for the appropriate audience (users vs contributors)
5. **Update Index**: Update this README when adding new documentation

### **Documentation Standards**
- **Markdown**: Use GitHub-flavored Markdown for all documentation
- **Structure**: Use clear headings and table of contents
- **Links**: Use relative links for internal documentation
- **Examples**: Provide practical, working code examples
- **Maintenance**: Keep documentation synchronized with code changes

---

**Generated by /sc:index** | **RhodoniteTS v0.17.4** | **Last Updated**: 2024